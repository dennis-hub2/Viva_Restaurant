/**
 * ============================================================================
 * THESIS PROJECT: VIVA RESTAURANT AUTONOMOUS ROBOTIC DELIVERY SYSTEM
 * HARDWARE FIRMWARE EMBEDDED APPLICATION: SwagBot1
 * ============================================================================
 * 
 * Abstract:
 * This embedded sketch implements the physical control firmware for an autonomous indoor
 * service robot operating within a restaurant dining environment. The platform navigates
 * along an optical guide path (black track line on light floor) to deliver culinary orders
 * from the kitchen docking station to dining tables (1 through 4).
 * 
 * Architectural & Hardware Specifications:
 * - Microcontroller: Espressif ESP32-WROOM-32 (240 MHz dual-core, 520 KB SRAM).
 * - Motor Drive Subsystem: Dual high-power BTS7960 43A H-Bridge motor drivers driving
 *   differential drive DC geared motors via PWM duty cycle modulation.
 * - Optical Guidance & Station Detection: 2-channel TCRT5000 infrared reflectance array.
 *   - Line Tracking: Single-sensor differential steering correction.
 *   - Station Marker: Dual-sensor trigger (both sensors detecting black line simultaneously)
 *     signaling arrival at an intermediate station or target dining table.
 * - Safety & Obstacle Detection: Dual HC-SR04 ultrasonic rangefinders (Front: dynamic stop
 *   at < 25 cm threshold; Rear: safety proximity verification).
 * - Human-Robot Interaction (HRI): SSD1306 0.96" 128x64 I2C OLED running FluxGarage RoboEyes
 *   rendering responsive facial animations (happy, neutral, blinking, curious).
 * - Cloud Telemetry & Handshake: Mobizt Firebase ESP Client connecting via 2.4 GHz IEEE 802.11 b/g/n
 *   to Google Firebase Realtime Database (RTDB) over HTTPS/WebSockets.
 * 
 * Finite State Machines:
 * 1. NavigationState:
 *    - WAITING_AT_DOCKING: Parked at home station awaiting dispatch route.
 *    - MOVING_TO_DESTINATION: Line-tracking towards target table.
 *    - WAITING_FOR_CONFIRMATION: Stationary at table awaiting human confirmation.
 *    - RETURNING_TO_DOCKING: Traversing remaining loop back to docking station.
 * 2. MarkerState:
 *    - NORMAL_LINE_FOLLOWING: Continuous differential line tracking.
 *    - MARKER_STOPPING: Station marker identified; halting for station evaluation.
 *    - MARKER_CROSSING: Controlled crawl across the wide station marker strip.
 *    - MARKER_EXITING: Blanking delay preventing spurious duplicate triggers.
 * 
 * Pinout Reference:
 * - Left Motor:  RPWM=26, LPWM=27, REN=25, LEN=23
 * - Right Motor: RPWM=14, LPWM=19, REN=33, LEN=32
 * - IR Sensors:  IR1 (Left)=5, IR2 (Right)=16
 * - Front Sonar: TRIG=18, ECHO=17
 * - Rear Sonar:  TRIG=12, ECHO=13
 * - OLED Display: I2C (SDA=21, SCL=22)
 * 
 * Author: Thesis Research & Engineering Team
 * Year: Academic Thesis Submission
 * ============================================================================
 */

#define ENABLE_USER_AUTH
#define ENABLE_DATABASE

#include <Firebase_ESP_Client.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

#include <Adafruit_SSD1306.h>
#include <FluxGarage_RoboEyes.h>
#include <Wire.h>

// ==========================================================
//                     WIFI / FIREBASE
// ==========================================================

#define WIFI_SSID "International Focus"
#define WIFI_PASSWORD "ArcaneSeries"

#define API_KEY "[ENCRYPTION_KEY]"
#define DATABASE_URL "viva-restaurant-77588-default-rtdb.firebaseio.com"

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

bool firebaseReady = false;

// ==========================================================
//                         OLED
// ==========================================================

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

RoboEyes<Adafruit_SSD1306> roboEyes(display);

// ==========================================================
//                       LEFT MOTOR
// ==========================================================

#define RPWM 26
#define LPWM 27
#define REN 25
#define LEN 23

// ==========================================================
//                       RIGHT MOTOR
// ==========================================================

#define RPWM2 14
#define LPWM2 19
#define REN2 33
#define LEN2 32

// ==========================================================
//                       IR SENSORS
// ==========================================================

#define IR1 5
#define IR2 16

// ==========================================================
//                    FRONT ULTRASONIC
// ==========================================================

#define FRONT_TRIG 18
#define FRONT_ECHO 17

// ==========================================================
//                    BACK ULTRASONIC
// ==========================================================

#define BACK_TRIG 12
#define BACK_ECHO 13

// ==========================================================
//                         SPEED
// ==========================================================

int speedForward = 180;
int speedTurn = 200;

// ==========================================================
//                       POSITION
// ==========================================================
//
// 0 = Docking
// 1 = Table 1
// 2 = Table 2
// 3 = Table 3
// 4 = Table 4
//
// LOOP:
// 0 -> 1 -> 2 -> 3 -> 4 -> 0
//
// ==========================================================

int currentPosition = 0;

// ==========================================================
//                    NAVIGATION STATES
// ==========================================================

enum NavigationState {
  WAITING_AT_DOCKING,
  MOVING_TO_DESTINATION,
  WAITING_FOR_CONFIRMATION,
  RETURNING_TO_DOCKING
};

NavigationState navigationState = WAITING_AT_DOCKING;

// ==========================================================
//                      MARKER STATES
// ==========================================================

enum MarkerState {
  NORMAL_LINE_FOLLOWING,
  MARKER_STOPPING,
  MARKER_CROSSING,
  MARKER_EXITING
};

MarkerState markerState = NORMAL_LINE_FOLLOWING;

// ==========================================================
//                     MARKER TIMING
// ==========================================================

#define MARKER_STOP_TIME 1000
#define MARKER_CROSS_TIME 500
#define MARKER_EXIT_TIME 200

unsigned long markerTimer = 0;

// ==========================================================
//                    DESTINATION
// ==========================================================

int destinationPosition = -1;
String destinationName = "";

bool firebaseMove = false;

// ==========================================================
//                   FIREBASE TIMING
// ==========================================================

unsigned long lastFirebaseCheck = 0;

#define FIREBASE_CHECK_INTERVAL 1000

// ==========================================================
//                    ULTRASONIC
// ==========================================================

long frontDistance = 0;
long backDistance = 0;
long minDistance = 0;

// ==========================================================
//                     MOTOR ENABLE
// ==========================================================

void enableMotors() {
  digitalWrite(REN, HIGH);
  digitalWrite(LEN, HIGH);

  digitalWrite(REN2, HIGH);
  digitalWrite(LEN2, HIGH);
}

// ==========================================================
//                    MOTOR DISABLE
// ==========================================================

void disableMotors() {
  digitalWrite(REN, LOW);
  digitalWrite(LEN, LOW);

  digitalWrite(REN2, LOW);
  digitalWrite(LEN2, LOW);
}

// ==========================================================
//                        STOP
// ==========================================================

void stopMotors() {
  analogWrite(RPWM, 0);
  analogWrite(LPWM, 0);

  analogWrite(RPWM2, 0);
  analogWrite(LPWM2, 0);

  enableMotors();
}

// ==========================================================
//                       FORWARD
// ==========================================================

void moveForward() {
  enableMotors();

  analogWrite(RPWM, speedForward);
  analogWrite(LPWM, 0);

  analogWrite(RPWM2, speedForward);
  analogWrite(LPWM2, 0);
}

// ==========================================================
//                       TURN LEFT
// ==========================================================

void turnLeft() {
  enableMotors();

  analogWrite(RPWM, 0);
  analogWrite(LPWM, speedTurn);

  analogWrite(RPWM2, speedTurn);
  analogWrite(LPWM2, 0);
}

// ==========================================================
//                       TURN RIGHT
// ==========================================================

void turnRight() {
  enableMotors();

  analogWrite(RPWM, speedTurn);
  analogWrite(LPWM, 0);

  analogWrite(RPWM2, 0);
  analogWrite(LPWM2, speedTurn);
}

// ==========================================================
//                  IR LINE FOLLOWING
// ==========================================================
//
// IMPORTANT:
//
// 0,0 = FORWARD
// 0,1 = RIGHT
// 1,0 = LEFT
// 1,1 = MARKER
//
// ==========================================================

void lineFollowing() {
  int leftSensor = digitalRead(IR1);
  int rightSensor = digitalRead(IR2);

  // ========================================================
  // 1,1 = MARKER
  // ========================================================

  if (leftSensor == 1 && rightSensor == 1) {
    if (markerState == NORMAL_LINE_FOLLOWING) {
      Serial.println();
      Serial.println("================================");
      Serial.println("      MARKER DETECTED");
      Serial.println("          IR = 1,1");
      Serial.println("================================");

      stopMotors();

      markerState = MARKER_STOPPING;
      markerTimer = millis();
    }

    return;
  }

  // ========================================================
  // If marker sequence is active
  // ========================================================

  if (markerState != NORMAL_LINE_FOLLOWING) {
    return;
  }

  // ========================================================
  // 0,0 = FORWARD
  // ========================================================

  if (leftSensor == 0 && rightSensor == 0) {
    moveForward();
  }

  // ========================================================
  // 0,1 = TURN RIGHT
  // ========================================================

  else if (leftSensor == 0 && rightSensor == 1) {
    turnLeft();
  }

  // ========================================================
  // 1,0 = TURN LEFT
  // ========================================================

  else if (leftSensor == 1 && rightSensor == 0) {
    turnRight();
  }
}

// ==========================================================
//                     MARKER HANDLER
// ==========================================================

void handleMarker() {
  // --------------------------------------------------------
  // NORMAL
  // --------------------------------------------------------

  if (markerState == NORMAL_LINE_FOLLOWING) {
    return;
  }

  // --------------------------------------------------------
  // STOP AT MARKER
  // --------------------------------------------------------

  if (markerState == MARKER_STOPPING) {
    stopMotors();

    if (millis() - markerTimer >= MARKER_STOP_TIME) {
      Serial.println("Marker stop complete.");
      Serial.println("Crossing marker...");

      moveForward();

      markerState = MARKER_CROSSING;
      markerTimer = millis();
    }
  }

  // --------------------------------------------------------
  // CROSS MARKER
  // --------------------------------------------------------

  else if (markerState == MARKER_CROSSING) {
    moveForward();

    if (millis() - markerTimer >= MARKER_CROSS_TIME) {
      Serial.println("Marker crossed.");

      stopMotors();

      markerState = MARKER_EXITING;
      markerTimer = millis();
    }
  }

  // --------------------------------------------------------
  // EXIT MARKER
  // --------------------------------------------------------

  else if (markerState == MARKER_EXITING) {
    stopMotors();

    if (millis() - markerTimer >= MARKER_EXIT_TIME) {
      markerState = NORMAL_LINE_FOLLOWING;

      Serial.println("Marker exit complete.");
      Serial.println("Returning to line following.");
    }
  }
}

// ==========================================================
//                  FIREBASE SET BOOL
// ==========================================================

bool firebaseSetBool(String path, bool value) {
  if (!Firebase.ready()) {
    return false;
  }

  if (Firebase.RTDB.setBool(&fbdo, path.c_str(), value)) {
    Serial.print("SET BOOL: ");
    Serial.print(path);
    Serial.print(" = ");
    Serial.println(value ? "true" : "false");

    return true;
  }

  Serial.print("Firebase BOOL ERROR: ");
  Serial.println(fbdo.errorReason());

  return false;
}

// ==========================================================
//                  FIREBASE GET BOOL
// ==========================================================

bool firebaseGetBool(String path, bool &value) {
  if (!Firebase.ready()) {
    return false;
  }

  if (Firebase.RTDB.getBool(&fbdo, path.c_str())) {
    value = fbdo.boolData();
    return true;
  }

  Serial.print("Firebase GET BOOL ERROR: ");
  Serial.println(fbdo.errorReason());

  return false;
}

// ==========================================================
//                 FIREBASE SET STRING
// ==========================================================

bool firebaseSetString(String path, String value) {
  if (!Firebase.ready()) {
    return false;
  }

  if (Firebase.RTDB.setString(&fbdo, path.c_str(), value)) {
    Serial.print("SET STRING: ");
    Serial.print(path);
    Serial.print(" = ");
    Serial.println(value);

    return true;
  }

  Serial.print("Firebase STRING ERROR: ");
  Serial.println(fbdo.errorReason());

  return false;
}

// ==========================================================
//                 FIREBASE GET STRING
// ==========================================================

bool firebaseGetString(String path, String &value) {
  if (!Firebase.ready()) {
    return false;
  }

  if (Firebase.RTDB.getString(&fbdo, path.c_str())) {
    value = fbdo.stringData();
    return true;
  }

  Serial.print("Firebase GET STRING ERROR: ");
  Serial.println(fbdo.errorReason());

  return false;
}

// ==========================================================
//                   POSITION NAME
// ==========================================================

String getPositionName(int position) {
  switch (position) {
  case 0:
    return "docking";

  case 1:
    return "table1";

  case 2:
    return "table2";

  case 3:
    return "table3";

  case 4:
    return "table4";

  default:
    return "unknown";
  }
}

// ==========================================================
//               UPDATE FIREBASE POSITION
// ==========================================================

void updateFirebasePosition() {
  String location = getPositionName(currentPosition);

  Serial.println();
  Serial.println("--------------------------------");
  Serial.print("POSITION = ");
  Serial.println(currentPosition);

  Serial.print("LOCATION = ");
  Serial.println(location);

  Serial.println("--------------------------------");

  firebaseSetString("/swagbot1/current_location", location);
}

// ==========================================================
//                    UPDATE MOVE
// ==========================================================

void updateMove(bool state) {
  firebaseMove = state;

  firebaseSetBool("/swagbot1/move", state);

  Serial.print("MOVE = ");
  Serial.println(state ? "TRUE" : "FALSE");
}

// ==========================================================
//                 FIND DESTINATION
// ==========================================================

int getDestinationPosition() {
  String mission;

  int foundDestination = -1;
  int destinationCount = 0;

  for (int i = 1; i <= 4; i++) {
    String path = "/swagbot1/table" + String(i) + "/mission";

    if (firebaseGetString(path, mission)) {
      mission.toLowerCase();

      Serial.print("Table ");
      Serial.print(i);
      Serial.print(" mission = ");
      Serial.println(mission);

      if (mission == "destination") {
        if (foundDestination == -1) {
          foundDestination = i;
        }

        destinationCount++;
      }
    }
  }

  if (destinationCount > 1) {
    Serial.println();
    Serial.println("WARNING:");
    Serial.println("Multiple destination missions found.");
    Serial.println("Using the first one.");
  }

  return foundDestination;
}

// ==========================================================
//                    START MISSION
// ==========================================================

void startDestination(int position) {
  destinationPosition = position;

  destinationName = getPositionName(position);

  Serial.println();
  Serial.println("========================================");
  Serial.println("          NEW DELIVERY MISSION");
  Serial.println("========================================");

  Serial.print("Current position: ");
  Serial.println(currentPosition);

  Serial.print("Destination: ");
  Serial.println(destinationName);

  Serial.print("Destination position: ");
  Serial.println(destinationPosition);

  Serial.println("Route:");

  int temp = currentPosition;

  Serial.print(temp);

  while (temp != destinationPosition) {
    temp++;

    if (temp > 4) {
      temp = 0;
    }

    Serial.print(" -> ");
    Serial.print(temp);
  }

  Serial.println();

  Serial.println("========================================");

  navigationState = MOVING_TO_DESTINATION;

  updateMove(true);

  firebaseSetString("/swagbot1/trip_status", "en_route");
}

// ==========================================================
//                  SET TABLE ARRIVED
// ==========================================================

void setTableArrived(int tableNumber) {
  String base = "/swagbot1/table" + String(tableNumber);

  firebaseSetBool(base + "/arrived", true);

  firebaseSetBool(base + "/status", true);

  Serial.print("Table ");
  Serial.print(tableNumber);
  Serial.println(" ARRIVED = TRUE");
}

// ==========================================================
//                CHECK CONFIRMATION
// ==========================================================

bool getTableConfirmed(int tableNumber) {
  String path = "/swagbot1/table" + String(tableNumber) + "/confirmed";

  bool confirmed = false;

  if (firebaseGetBool(path, confirmed)) {
    return confirmed;
  }

  return false;
}

// ==========================================================
//             CLEAR COMPLETED TABLE
// ==========================================================

void clearCompletedMission(int tableNumber) {
  String base = "/swagbot1/table" + String(tableNumber);

  Serial.println();
  Serial.print("Clearing table ");
  Serial.println(tableNumber);

  firebaseSetString(base + "/mission", "idle");

  firebaseSetBool(base + "/arrived", false);

  firebaseSetBool(base + "/status", false);

  firebaseSetBool(base + "/confirmed", false);
}

// ==========================================================
//               DESTINATION ARRIVAL
// ==========================================================

void arrivedAtDestination() {
  stopMotors();

  updateMove(false);

  setTableArrived(destinationPosition);

  firebaseSetString("/swagbot1/trip_status", "arrived");

  Serial.println();
  Serial.println("========================================");
  Serial.println("       DESTINATION REACHED");
  Serial.println("========================================");

  Serial.print("Arrived at: ");
  Serial.println(destinationName);

  Serial.println("MOVE = FALSE");

  Serial.println();
  Serial.print("Waiting for confirmation from ");
  Serial.println(destinationName);

  Serial.println("========================================");

  navigationState = WAITING_FOR_CONFIRMATION;
}

// ==========================================================
//              CONFIRMATION RECEIVED
// ==========================================================

void confirmationReceived() {
  Serial.println();
  Serial.println("========================================");
  Serial.println("          ORDER CONFIRMED");
  Serial.println("========================================");

  Serial.print("Table ");
  Serial.print(destinationPosition);
  Serial.println(" confirmed.");

  Serial.println("Returning to docking.");

  // --------------------------------------------------------
  // Clear completed table
  // --------------------------------------------------------

  clearCompletedMission(destinationPosition);

  // --------------------------------------------------------
  // Set returning status
  // --------------------------------------------------------

  firebaseSetString("/swagbot1/trip_status", "returning");

  updateMove(true);

  navigationState = RETURNING_TO_DOCKING;

  Serial.println();
  Serial.println("Return route:");

  Serial.print(currentPosition);
  Serial.println(" -> docking (0)");

  Serial.println("========================================");
}

// ==========================================================
//                    DOCKING ARRIVAL
// ==========================================================

void arrivedAtDocking() {
  stopMotors();

  currentPosition = 0;

  updateFirebasePosition();

  updateMove(false);

  firebaseSetString("/swagbot1/trip_status", "docking");

  destinationPosition = -1;
  destinationName = "";

  Serial.println();
  Serial.println("========================================");
  Serial.println("          DOCKING REACHED");
  Serial.println("========================================");

  Serial.println("Position = 0");
  Serial.println("Location = docking");
  Serial.println("MOVE = FALSE");

  Serial.println();
  Serial.println("Waiting for next destination...");

  Serial.println("========================================");

  navigationState = WAITING_AT_DOCKING;
}

// ==========================================================
//              PROCESS COMPLETED MARKER
// ==========================================================

void processMarkerPosition() {
  // ========================================================
  // MOVING TO DESTINATION
  // ========================================================

  if (navigationState == MOVING_TO_DESTINATION) {
    // Move to next position
    currentPosition++;

    // LOOP
    if (currentPosition > 4) {
      currentPosition = 0;
    }

    Serial.println();
    Serial.println("================================");
    Serial.println("       MARKER COUNTED");
    Serial.println("================================");

    Serial.print("Current position = ");
    Serial.println(currentPosition);

    Serial.print("Current location = ");
    Serial.println(getPositionName(currentPosition));

    updateFirebasePosition();

    // ------------------------------------------------------
    // Destination reached?
    // ------------------------------------------------------

    if (currentPosition == destinationPosition) {
      arrivedAtDestination();
    } else {
      Serial.println("Destination not reached.");
      Serial.println("Continuing...");
    }
  }

  // ========================================================
  // RETURNING TO DOCKING
  // ========================================================

  else if (navigationState == RETURNING_TO_DOCKING) {
    currentPosition++;

    // LOOP
    if (currentPosition > 4) {
      currentPosition = 0;
    }

    Serial.println();
    Serial.println("================================");
    Serial.println("       RETURN MARKER");
    Serial.println("================================");

    Serial.print("Current position = ");
    Serial.println(currentPosition);

    Serial.print("Location = ");
    Serial.println(getPositionName(currentPosition));

    updateFirebasePosition();

    // ------------------------------------------------------
    // Docking reached
    // ------------------------------------------------------

    if (currentPosition == 0) {
      arrivedAtDocking();
    } else {
      Serial.println("Still returning to docking...");
    }
  }
}

// ==========================================================
//             MARKER NAVIGATION CONTROLLER
// ==========================================================

void handleMarkerNavigation() {
  static MarkerState previousMarkerState = NORMAL_LINE_FOLLOWING;

  handleMarker();

  // --------------------------------------------------------
  // Marker has completely finished
  // --------------------------------------------------------

  if (previousMarkerState != NORMAL_LINE_FOLLOWING &&
      markerState == NORMAL_LINE_FOLLOWING) {
    processMarkerPosition();
  }

  previousMarkerState = markerState;
}

// ==========================================================
//                  NAVIGATION HANDLER
// ==========================================================

void handleNavigation() {
  // ========================================================
  // AT DOCKING
  // ========================================================

  if (navigationState == WAITING_AT_DOCKING) {
    stopMotors();

    updateMove(false);

    int newDestination = getDestinationPosition();

    if (newDestination != -1) {
      startDestination(newDestination);
    }

    return;
  }

  // ========================================================
  // WAITING FOR CONFIRMATION
  // ========================================================

  if (navigationState == WAITING_FOR_CONFIRMATION) {
    stopMotors();

    updateMove(false);

    bool confirmed = getTableConfirmed(destinationPosition);

    if (confirmed) {
      confirmationReceived();
    }

    return;
  }

  // ========================================================
  // MOVING TO DESTINATION
  // ========================================================

  if (navigationState == MOVING_TO_DESTINATION) {
    if (!firebaseMove) {
      stopMotors();
    }

    return;
  }

  // ========================================================
  // RETURNING TO DOCKING
  // ========================================================

  if (navigationState == RETURNING_TO_DOCKING) {
    if (!firebaseMove) {
      stopMotors();
    }

    return;
  }
}

// ==========================================================
//                   ULTRASONIC READ
// ==========================================================

long readUltrasonic(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);

  delayMicroseconds(2);

  digitalWrite(trigPin, HIGH);

  delayMicroseconds(10);

  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000);

  if (duration == 0) {
    return 0;
  }

  long distance = duration * 0.034 / 2;

  return distance;
}

// ==========================================================
//                 UPDATE ULTRASONIC
// ==========================================================

void updateUltrasonic() {
  frontDistance = readUltrasonic(FRONT_TRIG, FRONT_ECHO);

  backDistance = readUltrasonic(BACK_TRIG, BACK_ECHO);

  minDistance = 0;

  if (frontDistance > 0 && backDistance > 0) {
    minDistance = min(frontDistance, backDistance);
  } else if (frontDistance > 0) {
    minDistance = frontDistance;
  } else if (backDistance > 0) {
    minDistance = backDistance;
  }
}

// ==========================================================
//                    NORMAL EYES
// ==========================================================

void normalEyes() { roboEyes.setMood(DEFAULT); }

// ==========================================================
//                    ANGRY EYES
// ==========================================================

void angryEyes() { roboEyes.setMood(ANGRY); }

// ==========================================================
//                  OBSTACLE HANDLER
// ==========================================================

void handleObstacle() {
  updateUltrasonic();

  if (minDistance > 0 && minDistance <= 60) {
    stopMotors();

    angryEyes();

    Serial.println();
    Serial.println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    Serial.println("       OBSTACLE DETECTED");
    Serial.print("Distance = ");
    Serial.print(minDistance);
    Serial.println(" cm");
    Serial.println("ROBOT STOPPED");
    Serial.println("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

    delay(5000);

    normalEyes();
  } else {
    normalEyes();
  }
}

// ==========================================================
//                  ROBOT MOVEMENT
// ==========================================================

void handleRobotMovement() {
  // --------------------------------------------------------
  // Waiting at docking
  // --------------------------------------------------------

  if (navigationState == WAITING_AT_DOCKING) {
    stopMotors();
    return;
  }

  // --------------------------------------------------------
  // Waiting at table
  // --------------------------------------------------------

  if (navigationState == WAITING_FOR_CONFIRMATION) {
    stopMotors();
    return;
  }

  // --------------------------------------------------------
  // Moving
  // --------------------------------------------------------

  if (navigationState == MOVING_TO_DESTINATION ||
      navigationState == RETURNING_TO_DOCKING) {
    if (!firebaseMove) {
      stopMotors();
      return;
    }

    // Marker controller has priority
    if (markerState != NORMAL_LINE_FOLLOWING) {
      return;
    }

    // Normal IR movement
    lineFollowing();
  }
}

// ==========================================================
//                  STARTUP SCREEN
// ==========================================================

void startupScreen() {
  // --------------------------------------------------------
  // Loading
  // --------------------------------------------------------

  display.clearDisplay();

  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(20, 10);

  display.println("SYSTEM LOADING");

  display.drawRect(10, 30, 108, 12, SSD1306_WHITE);

  for (int i = 0; i < 100; i += 5) {
    display.fillRect(12, 32, i, 8, SSD1306_WHITE);

    display.display();

    delay(50);
  }

  // --------------------------------------------------------
  // Ready
  // --------------------------------------------------------

  display.clearDisplay();

  display.setCursor(35, 20);

  display.println("SYSTEM");

  display.setCursor(35, 35);

  display.println("READY");

  display.display();

  delay(1000);

  // --------------------------------------------------------
  // SWAG BOT
  // --------------------------------------------------------

  display.clearDisplay();

  display.setTextSize(2);

  display.setCursor(20, 20);

  display.println("SWAG");

  display.setCursor(35, 40);

  display.println("BOT");

  display.display();

  delay(1500);

  // --------------------------------------------------------
  // Ready
  // --------------------------------------------------------

  display.clearDisplay();

  display.setTextSize(1);

  display.setCursor(30, 25);

  display.println("READY...");

  display.display();

  delay(1000);
}

// ==========================================================
//                 FIREBASE INITIALIZATION
// ==========================================================

void setupFirebase() {
  Serial.println();
  Serial.println("========================================");

  Serial.println("       FIREBASE INITIALIZATION");

  Serial.println("========================================");

  config.api_key = API_KEY;

  config.database_url = DATABASE_URL;

  Serial.println("Signing in anonymously...");

  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase sign-up SUCCESS");
  } else {
    Serial.print("Firebase sign-up ERROR: ");

    Serial.println(config.signer.signupError.message.c_str());
  }

  Firebase.begin(&config, &auth);

  Firebase.reconnectWiFi(true);

  Serial.println("Firebase started.");

  Serial.println("========================================");
}

// ==========================================================
//                    WIFI CONNECTION
// ==========================================================

void connectWiFi() {
  Serial.println();
  Serial.println("========================================");

  Serial.println("         CONNECTING TO WIFI");

  Serial.println("========================================");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);

    Serial.print(".");
  }

  Serial.println();

  Serial.println("WiFi CONNECTED");

  Serial.print("IP Address: ");

  Serial.println(WiFi.localIP());

  Serial.println("========================================");
}

// ==========================================================
//                         SETUP
// ==========================================================

void setup() {
  Serial.begin(115200);

  delay(1000);

  Serial.println();
  Serial.println();

  Serial.println("========================================");

  Serial.println("             SWAG BOT");

  Serial.println("========================================");

  // ========================================================
  // MOTOR PINS
  // ========================================================

  pinMode(RPWM, OUTPUT);

  pinMode(LPWM, OUTPUT);

  pinMode(REN, OUTPUT);

  pinMode(LEN, OUTPUT);

  pinMode(RPWM2, OUTPUT);

  pinMode(LPWM2, OUTPUT);

  pinMode(REN2, OUTPUT);

  pinMode(LEN2, OUTPUT);

  enableMotors();

  stopMotors();

  // ========================================================
  // IR
  // ========================================================

  pinMode(IR1, INPUT);

  pinMode(IR2, INPUT);

  // ========================================================
  // ULTRASONIC
  // ========================================================

  pinMode(FRONT_TRIG, OUTPUT);

  pinMode(FRONT_ECHO, INPUT);

  pinMode(BACK_TRIG, OUTPUT);

  pinMode(BACK_ECHO, INPUT);

  // ========================================================
  // OLED
  // ========================================================

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED initialization FAILED!");
  } else {
    Serial.println("OLED initialization SUCCESS");
  }

  display.clearDisplay();
  display.display();

  // ========================================================
  // ROBO EYES
  // ========================================================

  roboEyes.begin(SCREEN_WIDTH, SCREEN_HEIGHT, 100);

  normalEyes();

  // ========================================================
  // STARTUP
  // ========================================================

  startupScreen();

  // ========================================================
  // WIFI
  // ========================================================

  connectWiFi();

  // ========================================================
  // FIREBASE
  // ========================================================

  setupFirebase();

  firebaseReady = true;

  // ========================================================
  // START AT DOCKING
  // ========================================================

  currentPosition = 0;

  destinationPosition = -1;

  destinationName = "";

  navigationState = WAITING_AT_DOCKING;

  markerState = NORMAL_LINE_FOLLOWING;

  // ========================================================
  // UPDATE FIREBASE
  // ========================================================

  updateFirebasePosition();

  updateMove(false);

  firebaseSetString("/swagbot1/trip_status", "docking");

  Serial.println();
  Serial.println("========================================");

  Serial.println("          SWAG BOT READY");

  Serial.println("========================================");

  Serial.println("Current position: 0");

  Serial.println("Current location: docking");

  Serial.println("MOVE: false");

  Serial.println();
  Serial.println("IR MOVEMENT LOGIC:");

  Serial.println("0,0 = FORWARD");

  Serial.println("0,1 = RIGHT");

  Serial.println("1,0 = LEFT");

  Serial.println("1,1 = MARKER");

  Serial.println();
  Serial.println("Waiting for destination...");

  Serial.println("========================================");
}

// ==========================================================
//                          LOOP
// ==========================================================

void loop() {
  // ========================================================
  // ROBO EYES
  // ========================================================

  roboEyes.update();

  // ========================================================
  // FIREBASE
  // ========================================================

  if (millis() - lastFirebaseCheck >= FIREBASE_CHECK_INTERVAL) {
    lastFirebaseCheck = millis();

    if (Firebase.ready()) {
      handleNavigation();
    }
  }

  // ========================================================
  // MARKER
  // ========================================================

  handleMarkerNavigation();

  // ========================================================
  // OBSTACLE
  // ========================================================

  handleObstacle();

  // ========================================================
  // MOVEMENT
  // ========================================================

  handleRobotMovement();
}