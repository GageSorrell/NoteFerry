#include "pch.h"
#include "SettingsWindow.h"

namespace NoteFerry {

namespace {
constexpr wchar_t ClassName[] = L"NoteFerrySettingsWindow";
}

LRESULT CALLBACK SettingsWindow::WindowProc(HWND window, UINT message, WPARAM wParam, LPARAM lParam) {
  switch (message) {
    case WM_CREATE: {
      // Recorded here (rather than from CreateWindowExW's return value) so the
      // singleton guard in ShowOrActivate is correct even before that call
      // returns - WM_CREATE fires synchronously with a valid window handle
      // while CreateWindowExW is still on the stack.
      s_window = window;

      // Placeholder content; a real settings UI will replace this.
      HINSTANCE instance = reinterpret_cast<HINSTANCE>(GetWindowLongPtrW(window, GWLP_HINSTANCE));
      CreateWindowExW(
          0,
          L"STATIC",
          L"Settings — coming soon.",
          WS_CHILD | WS_VISIBLE | SS_CENTER,
          20,
          20,
          360,
          40,
          window,
          nullptr,
          instance,
          nullptr);
      return 0;
    }
    case WM_DESTROY:
      s_window = nullptr;
      return 0;
  }

  return DefWindowProcW(window, message, wParam, lParam);
}

void SettingsWindow::ShowOrActivate(HINSTANCE instance) {
  if (s_window && IsWindow(s_window)) {
    ShowWindow(s_window, SW_RESTORE);
    SetForegroundWindow(s_window);
    return;
  }

  if (!s_classRegistered) {
    WNDCLASSEXW windowClass{};
    windowClass.cbSize = sizeof(windowClass);
    windowClass.lpfnWndProc = &WindowProc;
    windowClass.hInstance = instance;
    windowClass.lpszClassName = ClassName;
    windowClass.hCursor = LoadCursorW(nullptr, IDC_ARROW);
    windowClass.hbrBackground = reinterpret_cast<HBRUSH>(COLOR_WINDOW + 1);
    RegisterClassExW(&windowClass);
    s_classRegistered = true;
  }

  // s_window is set from within WM_CREATE (see WindowProc); the return value
  // here is just used for the immediate null-check below.
  HWND createdWindow = CreateWindowExW(
      WS_EX_APPWINDOW,
      ClassName,
      L"NoteFerry Settings",
      WS_OVERLAPPEDWINDOW & ~WS_MAXIMIZEBOX & ~WS_THICKFRAME,
      CW_USEDEFAULT,
      CW_USEDEFAULT,
      420,
      160,
      nullptr,
      nullptr,
      instance,
      nullptr);

  if (createdWindow) {
    ShowWindow(s_window, SW_SHOW);
    SetForegroundWindow(s_window);
  }
}

} // namespace NoteFerry
