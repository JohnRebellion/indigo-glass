// Lime Glass - SDDM greeter
// Minimal login form. Single accent. Translucent panel over mesh wallpaper.

import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import SddmComponents 2.0

Rectangle {
    id: root
    width: Screen.width
    height: Screen.height
    color: "#0F0F12"

    property string accent: "#A8E635"
    property string accentHi: "#C1FF58"
    property string onAccent: "#07080A"  // dark text on the light lime accent
    property string surfaceAlt: "#1F2028"
    property string text: "#F8F8F8"
    property string textMuted: "#6B7280"

    // Mesh background (SVG provided in theme dir as background.svg).
    // If background.svg missing, the solid #0F0F12 fill above shows.
    Image {
        anchors.fill: parent
        source: "background.svg"
        fillMode: Image.PreserveAspectCrop
        smooth: true
        cache: true
        asynchronous: true
        opacity: 0.92
    }

    // Subtle vignette
    Rectangle {
        anchors.fill: parent
        gradient: Gradient {
            GradientStop { position: 0.0; color: "#00000000" }
            GradientStop { position: 1.0; color: "#80000000" }
        }
    }

    Item {
        anchors.centerIn: parent
        width: 360
        height: panel.implicitHeight

        Rectangle {
            id: panel
            anchors.fill: parent
            color: Qt.rgba(0.12, 0.13, 0.16, 0.70)
            border.width: 1
            border.color: Qt.rgba(1, 1, 1, 0.06)
            radius: 12
            implicitHeight: layout.implicitHeight + 32

            ColumnLayout {
                id: layout
                anchors.fill: parent
                anchors.margins: 16
                spacing: 10

                // Brand
                RowLayout {
                    Layout.alignment: Qt.AlignHCenter
                    spacing: 6

                    Rectangle {
                        width: 10; height: 10; radius: 5
                        color: accent
                    }
                    Text {
                        text: "Lime Glass"
                        font.family: "Carlito"
                        font.pixelSize: 14
                        font.weight: Font.Bold
                        color: text
                    }
                }

                // User selector
                ComboBox {
                    id: userInput
                    Layout.fillWidth: true
                    Layout.preferredHeight: 28
                    model: userModel
                    textRole: "name"
                    currentIndex: userModel.lastIndex

                    background: Rectangle {
                        color: surfaceAlt
                        border.width: 1
                        border.color: userInput.activeFocus ? accent : Qt.rgba(1,1,1,0.06)
                        radius: 4
                    }
                    contentItem: Text {
                        text: userInput.currentText
                        color: text
                        font.family: "Carlito"
                        font.pixelSize: 11
                        leftPadding: 8
                        verticalAlignment: Text.AlignVCenter
                    }
                }

                // Password
                TextField {
                    id: passwordInput
                    Layout.fillWidth: true
                    Layout.preferredHeight: 28
                    echoMode: TextInput.Password
                    placeholderText: "Password"
                    color: text
                    placeholderTextColor: textMuted
                    font.family: "Carlito"
                    font.pixelSize: 11
                    leftPadding: 8
                    background: Rectangle {
                        color: surfaceAlt
                        border.width: 1
                        border.color: passwordInput.activeFocus ? accent : Qt.rgba(1,1,1,0.06)
                        radius: 4
                    }
                    Keys.onReturnPressed: loginButton.clicked()
                }

                // Login button
                Button {
                    id: loginButton
                    Layout.fillWidth: true
                    Layout.preferredHeight: 28
                    text: "Sign in"

                    background: Rectangle {
                        color: loginButton.pressed ? accentHi : accent
                        radius: 4
                    }
                    contentItem: Text {
                        text: loginButton.text
                        color: onAccent
                        font.family: "Carlito"
                        font.pixelSize: 11
                        font.weight: Font.Medium
                        horizontalAlignment: Text.AlignHCenter
                        verticalAlignment: Text.AlignVCenter
                    }
                    onClicked: sddm.login(userInput.currentText, passwordInput.text, sessionInput.currentIndex)
                }

                // Session selector
                ComboBox {
                    id: sessionInput
                    Layout.fillWidth: true
                    Layout.preferredHeight: 24
                    model: sessionModel
                    textRole: "name"
                    currentIndex: sessionModel.lastIndex

                    background: Rectangle {
                        color: "transparent"
                        border.width: 1
                        border.color: Qt.rgba(1,1,1,0.06)
                        radius: 4
                    }
                    contentItem: Text {
                        text: sessionInput.currentText
                        color: textMuted
                        font.family: "Carlito"
                        font.pixelSize: 9
                        leftPadding: 8
                        verticalAlignment: Text.AlignVCenter
                    }
                }
            }
        }
    }

    // Footer
    Text {
        anchors.bottom: parent.bottom
        anchors.right: parent.right
        anchors.margins: 12
        text: Qt.formatTime(new Date(), "hh:mm")
        font.family: "Iosevka Custom Condensed"
        font.pixelSize: 22
        color: textMuted

        Timer {
            interval: 1000
            running: true
            repeat: true
            onTriggered: parent.text = Qt.formatTime(new Date(), "hh:mm")
        }
    }

    Connections {
        target: sddm
        function onLoginFailed() {
            passwordInput.text = ""
            passwordInput.focus = true
        }
    }
}
