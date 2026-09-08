#include "pch.h"
#include "TrayIcon.h"

#include "resource.h"

#include <CommCtrl.h>
#include <shellapi.h>
#include <winrt/Windows.UI.ViewManagement.h>

#pragma comment(lib, "Comctl32.lib")

using winrt::Windows::UI::ViewManagement::UIColorType;
using winrt::Windows::UI::ViewManagement::UISettings;

namespace NoteFerry
{

TrayIcon::TrayIcon(HWND ownerWindow, HINSTANCE instance, std::wstring versionLabel)
    : m_ownerWindow(ownerWindow), m_instance(instance), m_versionLabel(std::move(versionLabel))
{
    AddIcon();
    SetWindowSubclass(m_ownerWindow, &SubclassProc, SubclassId, reinterpret_cast<DWORD_PTR>(this));
}

TrayIcon::~TrayIcon()
{
    RemoveWindowSubclass(m_ownerWindow, &SubclassProc, SubclassId);

    NOTIFYICONDATAW data{};
    data.cbSize = sizeof(data);
    data.hWnd = m_ownerWindow;
    data.uID = NotifyIconId;
    Shell_NotifyIconW(NIM_DELETE, &data);

    if (m_icon)
    {
        DestroyIcon(m_icon);
    }
}

void TrayIcon::AddIcon()
{
    m_icon = LoadThemedIcon();

    NOTIFYICONDATAW data{};
    data.cbSize = sizeof(data);
    data.hWnd = m_ownerWindow;
    data.uID = NotifyIconId;
    data.uFlags = NIF_ICON | NIF_MESSAGE | NIF_TIP | NIF_SHOWTIP;
    data.uCallbackMessage = WM_TRAYICON;
    data.hIcon = m_icon;
    wcscpy_s(data.szTip, L"NoteFerry");
    Shell_NotifyIconW(NIM_ADD, &data);

    // Opt into the modern callback message layout (cursor position packed into
    // wParam) so we don't need a separate GetCursorPos call.
    NOTIFYICONDATAW version{};
    version.cbSize = sizeof(version);
    version.hWnd = m_ownerWindow;
    version.uID = NotifyIconId;
    version.uVersion = NOTIFYICON_VERSION_4;
    Shell_NotifyIconW(NIM_SETVERSION, &version);
}

HICON TrayIcon::LoadThemedIcon() const
{
    LPCWSTR resource = IsDarkThemeActive() ? MAKEINTRESOURCEW(IDI_TRAY_DARK) : MAKEINTRESOURCEW(IDI_TRAY_LIGHT);
    int cx = GetSystemMetrics(SM_CXSMICON);
    int cy = GetSystemMetrics(SM_CYSMICON);
    return static_cast<HICON>(LoadImageW(m_instance, resource, IMAGE_ICON, cx, cy, LR_DEFAULTCOLOR));
}

bool TrayIcon::IsDarkThemeActive() const
{
    // There's no direct "app theme" flag outside XAML; the documented pattern
    // for plain Win32/WinRT code is to inspect the system's background color -
    // dark theme resolves to a near-black background, light theme to a
    // near-white one.
    auto background = UISettings().GetColorValue(UIColorType::Background);
    return background.R < 128;
}

void TrayIcon::ShowContextMenu(POINT screenPoint)
{
    HMENU menu = CreatePopupMenu();
    if (!menu)
    {
        return;
    }

    std::wstring versionEntry = L"NoteFerry v" + m_versionLabel;
    AppendMenuW(menu, MF_STRING | MF_GRAYED, CommandVersion, versionEntry.c_str());
    AppendMenuW(menu, MF_STRING, CommandSettings, L"Settings");
    AppendMenuW(menu, MF_STRING, CommandExit, L"Exit");

    // The owner window must be the foreground window or the menu won't
    // dismiss itself when the user clicks elsewhere.
    SetForegroundWindow(m_ownerWindow);
    UINT command = static_cast<UINT>(
        TrackPopupMenuEx(menu, TPM_RIGHTBUTTON | TPM_RETURNCMD, screenPoint.x, screenPoint.y, m_ownerWindow, nullptr));
    // Required companion to SetForegroundWindow above; see Shell_NotifyIcon docs.
    PostMessageW(m_ownerWindow, WM_NULL, 0, 0);

    DestroyMenu(menu);

    switch (command)
    {
    case CommandSettings:
        if (OnSettingsRequested)
        {
            OnSettingsRequested();
        }
        break;
    case CommandExit:
        if (OnExitRequested)
        {
            OnExitRequested();
        }
        break;
    }
}

LRESULT CALLBACK TrayIcon::SubclassProc(HWND window, UINT message, WPARAM wParam, LPARAM lParam,
                                        UINT_PTR /* subclassId */, DWORD_PTR referenceData)
{
    auto self = reinterpret_cast<TrayIcon *>(referenceData);

    if (message == WM_TRAYICON && self)
    {
        UINT mouseMessage = LOWORD(lParam);
        if (mouseMessage == WM_RBUTTONUP || mouseMessage == WM_CONTEXTMENU)
        {
            POINT screenPoint{static_cast<SHORT>(LOWORD(wParam)), static_cast<SHORT>(HIWORD(wParam))};
            self->ShowContextMenu(screenPoint);
        }
        return 0;
    }

    return DefSubclassProc(window, message, wParam, lParam);
}

} // namespace NoteFerry
