// Sage Ink - SDDM greeter
// Minimal login form. Single accent. Opaque ink panel over mesh wallpaper,
// hard offset shadow (was a translucent panel through the Lime Glass era).

import QtQuick 2.15
import QtQuick.Controls 2.15
import QtQuick.Layouts 1.15
import QtQuick.Window 2.15 // Screen is a QtQuick.Window attached type in Qt 5
import SddmComponents 2.0

Rectangle {
    id: root
    width: Screen.width
    height: Screen.height
    color: base

    // Sage Ink tokens (tokens/out/css-vars.css, variant sage). Hand-typed:
    // check-palette-drift.sh and simulator /desktop/sddm/ hold them to the TOML.
    property string base: "#07080A"
    property string accent: "#A6C9A6"
    property string accentHi: "#C0E3C0"
    // Was `onAccent`: a property named on<Upper> parses as a signal handler, so
    // Qt 5 and Qt 6 both refused to load this file ("Cannot assign a value to a signal").
    property string accentInk: "#07080A"  // base - dark text on the light sage accent
    property string surfaceAlt: "#121216" // was an off-palette grey
    property string borderStrong: "#5E5E60"
    property string accentAlt: "#89A889"  // accent_alt - the ink shadow colour
    property string text: "#F8F8F8"
    property string textMuted: "#7F8695"

    // Mesh background (SVG provided in theme dir as background.svg).
    // If background.svg missing, the solid base fill above shows.
    Image {
        anchors.fill: parent
        source: "background.svg"
        fillMode: Image.PreserveAspectCrop
        smooth: true
        cache: true
        asynchronous: true
        // opacity 0.92 and a 0->50% black gradient vignette removed: ink has
        // no translucency and no gradient.
    }

    Item {
        anchors.centerIn: parent
        width: 360
        height: panel.implicitHeight

        // Hard offset shadow - ink material, zero blur, colour-as-elevation.
        // Offset is --ig-shadow-ink-lg (7px): the login panel is a modal,
        // level 3 in docs/ELEVATION.md (was 8px, the pre-2026-09-24 ink offset).
        Rectangle {
            x: 7
            y: 7
            width: panel.width
            height: panel.height
            color: accentAlt // [shadow].ink_lg resolves to accent_alt, opaque (was Qt.rgba(0,0,0,0.9): black and translucent)
        }

        Rectangle {
            id: panel
            anchors.fill: parent
            color: base // was Qt.rgba(0.12, 0.13, 0.16): off the palette, and not even surfaceAlt.
            // base, as the simulator's nb-dialog: border_strong clears 3:1 on base, not on surface.
            // Border 2px border_strong: the modal edge in docs/ELEVATION.md
            // (was solid black, from the neobrutalism.dev reference audit).
            border.width: 2
            border.color: borderStrong
            radius: 0
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
                        text: "Sage Ink"
                        font.family: "Carlito"
                        font.pixelSize: 14
                        font.weight: Font.Bold
                        color: root.text // unqualified `text` resolved to this Text's own string -> invalid colour -> black
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
                        border.width: 2 // controls take 2px (was a 1px hairline)
                        border.color: userInput.activeFocus ? accent : borderStrong // was an off-palette grey at 1.2:1 on the fill
                        radius: 0 // was 4, off the 0/2/9999 ink radius ladder
                    }
                    contentItem: Text {
                        text: userInput.currentText
                        color: root.text // unqualified `text` resolved to this Text's own string -> invalid colour -> black
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
                    color: root.text // unqualified `text` resolved to the typed password -> black dots
                    placeholderTextColor: textMuted
                    font.family: "Carlito"
                    font.pixelSize: 11
                    leftPadding: 8
                    background: Rectangle {
                        color: surfaceAlt
                        border.width: 2 // controls take 2px (was a 1px hairline)
                        border.color: passwordInput.activeFocus ? accent : borderStrong // was an off-palette grey at 1.2:1 on the fill
                        radius: 0 // was 4, off the 0/2/9999 ink radius ladder
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
                        radius: 0 // was 4, off the 0/2/9999 ink radius ladder
                    }
                    contentItem: Text {
                        text: loginButton.text
                        color: accentInk
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
                        border.width: 2 // controls take 2px (was a 1px hairline)
                        border.color: borderStrong // was an off-palette grey
                        radius: 0 // was 4, off the 0/2/9999 ink radius ladder
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
