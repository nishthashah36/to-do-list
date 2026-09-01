# Floral Todo

A personal light-pink-and-blue to-do list for iPhone. It runs in Scriptable, stores tasks privately in iCloud Drive, and includes a home-screen widget that displays the list without opening the editor.

## Features

- High, medium, and low priority
- Optional due dates
- Custom categories
- Today, all tasks, and completed views
- Light floral editor
- Small, medium, and large widgets
- No account, database, or Apple Developer subscription

## Install on iPhone

1. Install **Scriptable** from the App Store.
2. Open `FloralTodo.js` in this repository and tap **Raw**.
3. Select all of the code and copy it.
4. Open Scriptable, tap **+**, paste the code, and name the script exactly `FloralTodo`.
5. Tap the script once. Add a test task, then close the editor with **Done** so it saves.
6. Long-press the iPhone home screen, tap **Edit**, then **Add Widget**.
7. Search for **Scriptable** and add the widget size you prefer.
8. Long-press the new widget, choose **Edit Widget**, and select `FloralTodo` as its script.

The widget displays tasks automatically. Tap it to open the floral editor. iOS decides the exact background refresh timing, so changes may not appear instantaneously every time.

## Update

Replace the code inside the existing `FloralTodo` Scriptable script with the latest contents of `FloralTodo.js`. Your tasks are stored separately in `FloralTodo/tasks.json`, so updating the script does not erase them.

## Privacy

Task data is stored in your Scriptable iCloud Drive folder. Do not commit `tasks.json` or personal task data to this repository.
