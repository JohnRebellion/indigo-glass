# Konsole ships no default *.profile file on disk for its compiled-in
# fallback profile — Profile::useFallback() fills Profile::DefaultProperties
# straight into memory (src/profile/Profile.cpp, Profile::DefaultProperties
# table and Profile::useFallback()). This file reconstructs that table in
# the same [Group]/Key=Value shape Konsole itself writes for a saved
# profile, so it can be parsed with the same parseIni() as a real one.
# Source: https://invent.kde.org/utilities/konsole/-/raw/master/src/profile/Profile.cpp
#   commit 362e8f0183fa9ac91074e070a3afd1d5de9cb16c, 2026-08-08
# and https://invent.kde.org/utilities/konsole/-/raw/master/src/Enumeration.h
# (Enum::HistoryModeEnum / ScrollBarPositionEnum / CursorShapeEnum values).
# No Font= key: the real default is QFontDatabase::systemFont(FixedFont), a
# runtime Qt call, not a literal string. The model falls back to the KDE
# "fixed" font role (kdeglobals) for this — see konsole/model.ts.
# Command is $SHELL at runtime (defaultShell(), Profile.cpp); /bin/bash
# stands in as the common case.

[Appearance]
ColorScheme=Breeze
LineSpacing=0
UseFontLineChararacters=false
WordCharacters=:@-./_~?&=%+#

[Cursor Options]
CursorShape=0
CustomCursorColor=255,255,255
CustomCursorTextColor=0,0,0
UseCustomCursorColor=false

[General]
Command=/bin/bash
Name=Built-in
TerminalColumns=110
TerminalRows=28

[Interaction Options]
AutoCopySelectedText=false
TrimLeadingWhitespacesInSelectedText=false
TrimTrailingWhitespacesInSelectedText=false

[Keyboard]
KeyBindings=default

[Scrolling]
HistoryMode=1
HistorySize=10000
ScrollBarPosition=1
