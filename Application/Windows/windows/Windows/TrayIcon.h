// TrayIcon.h : a system tray icon with a right-click context menu offering
// quick access to Settings and Exit.
//
#pragma once

#include <functional>
#include <string>

namespace NoteFerry
{

class TrayIcon
{
public:
    // ownerWindow must be a top-level window belonging to this thread; its
    // WndProc is non-invasively subclassed (via SetWindowSubclass) to receive
    // the tray icon's callback messages.
    TrayIcon(HWND ownerWindow, HINSTANCE instance, std::wstring versionLabel);
    ~TrayIcon();

    TrayIcon(const TrayIcon &) = delete;
    TrayIcon &operator=(const TrayIcon &) = delete;

    // Invoked (on the owner window's thread) when the user selects "Settings".
    std::function<void()> OnSettingsRequested;
    // Invoked (on the owner window's thread) when the user selects "Exit".
    std::function<void()> OnExitRequested;

private:
    enum CommandId : UINT_PTR
    {
        CommandVersion = 1,
        CommandSettings = 2,
        CommandExit = 3,
    };

    void AddIcon();
    void ShowContextMenu(POINT screenPoint);
    HICON LoadThemedIcon() const;
    bool IsDarkThemeActive() const;

    static LRESULT CALLBACK SubclassProc(HWND window, UINT message, WPARAM wParam, LPARAM lParam, UINT_PTR subclassId,
                                         DWORD_PTR referenceData);

    HWND m_ownerWindow{};
    HINSTANCE m_instance{};
    std::wstring m_versionLabel;
    HICON m_icon{};

    static constexpr UINT WM_TRAYICON = WM_APP + 1;
    static constexpr UINT_PTR SubclassId = 1;
    static constexpr UINT NotifyIconId = 1;
};

} // namespace NoteFerry
