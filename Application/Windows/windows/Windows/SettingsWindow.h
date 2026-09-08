// SettingsWindow.h : a placeholder native window opened from the tray icon's
// "Settings" menu entry. Runs on the same thread/message loop as the app's
// main window, so no extra message pump is needed.
//
#pragma once

namespace NoteFerry {

class SettingsWindow {
 public:
  // Creates the window on first call; brings it to the foreground on
  // subsequent calls if it's still open.
  static void ShowOrActivate(HINSTANCE instance);

 private:
  static LRESULT CALLBACK WindowProc(HWND window, UINT message, WPARAM wParam, LPARAM lParam);

  static inline HWND s_window{};
  static inline bool s_classRegistered{false};
};

} // namespace NoteFerry
