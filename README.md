# 🍚 白飯分配計算機

飲控時兩個人煮一鍋飯，各自要吃的米量不一樣，吃的時候要怎麼分才正確？

這個 App 會依照**各自放進鍋裡的白米重量**算出分配比例，再根據**當下鍋子的總重**，告訴你這一餐兩個人各可以盛多少克的飯。一鍋飯分好幾餐吃也沒問題，App 會記錄每一餐，自動算出每個人還剩多少。

用 React + Vite + Tailwind CSS 開發，透過 Capacitor 打包成 Android App。

## ✨ 功能

- **依米量自動算比例**：輸入你和朋友各自的白米量（克），立即顯示雙方的占比
- **自動扣除鍋重**：只要秤整鍋的重量，App 會扣掉鍋子空重（預設 247g，可在「進階設定」修改）
- **多餐分配**：第一餐用「初始份量」計算，第二餐起改用「剩餘份量」計算，一鍋飯可以分很多餐吃
- **快速分數按鈕**：第二餐起會出現 `1/7`、`2/7`、`3/7` 這類按鈕，不用自己換算
- **兩人吃不同比例**：打開「朋友吃不同比例」開關，可以分別設定你和朋友這餐要吃多少
- **今日進度**：用進度條顯示每個人已經吃了自己份量的百分之幾，並列出每一餐的紀錄（可刪除）
- **自動儲存**：所有資料存在手機本機，關掉 App 再打開也還在
- **重新煮一鍋**：吃完了就按「重新煮一鍋」，清除紀錄重新開始（米量設定會保留）

## 📖 使用方式

### 1. 設定米量

在「白米量（克）」輸入你和朋友各自的生米重量。

> 例：你 440g、朋友 160g → 你占 **73.3%**、朋友占 **26.7%**

### 2. 第一餐：初始份量法

飯剛煮好時，把**整鍋**放上秤，輸入總重，再選這餐要吃「自己那份的幾 %」。

```
這餐可以吃 = (整鍋重 − 鍋子空重) × 你的比例 × 這餐 %
```

> 例：整鍋 1447g，扣掉鍋重 247g 後有 1200g 的飯
> - 你的份量 = 1200 × 73.3% = 880g，朋友的份量 = 320g
> - 這餐吃 30%（輸入 `0.3`）→ 你吃 **264g**、朋友吃 **96g**

按下「這餐吃完了 ✓」，App 會把這次的整鍋重量記下來，當作之後的基準。

### 3. 第二餐之後：剩餘份量法

再秤一次鍋子目前的總重。這時候輸入的 % 是「**剩下的份量**」的幾 %，而不是一開始的份量。

> 接續上面的例子：第一餐吃了 3/10，兩個人都剩 7/10
> - 想吃**原本份量的 30%**，就輸入 `3/7`（點快速按鈕即可，等於 `0.4286`）
> - 鍋子現在 1087g → 你吃 **264g**、朋友吃 **96g**，跟第一餐一樣多

剩餘份量法的好處是：飯放冰箱或加熱過後重量可能會變，只要用「剩下的幾分之幾」來算，就能一直按原本的比例分，不用管飯本身變輕或變重。

### 4. 兩個人吃的量不一樣

打開「朋友吃不同比例」的開關，就可以分別輸入你和朋友這餐的比例。App 會分開記錄雙方的剩餘量，之後幾餐的分配比例也會跟著調整。

## 🛠️ 開發環境

### 需要的工具

| 工具 | 版本 | 用途 |
| --- | --- | --- |
| [Node.js](https://nodejs.org) | 18 以上 | 安裝套件、執行開發伺服器 |
| [Android Studio](https://developer.android.com/studio) | 最新版 | 打包 APK（安裝時記得勾選 Android SDK） |
| JDK | 17 | Android 編譯用（Android Studio 通常已內建） |

只想在瀏覽器裡修改、測試的話，裝 Node.js 就夠了。

### 下載與安裝

```bash
git clone https://github.com/thamyh/RiceCal.git
cd RiceCal
npm install
```

### 在瀏覽器中執行

```bash
npm run dev
```

打開終端機顯示的網址（通常是 http://localhost:5173），改了 `src/` 裡的程式碼會自動重新整理。建議用瀏覽器的手機模擬模式來看，畫面比較接近實際在手機上的樣子。

### 可用指令

| 指令 | 說明 |
| --- | --- |
| `npm run dev` | 啟動開發伺服器 |
| `npm run build` | 編譯網頁版本到 `dist/` |
| `npm run preview` | 預覽編譯後的網頁版本 |
| `npm run android:init` | 編譯並建立 `android/` 專案（只需做一次） |
| `npm run android` | 編譯、同步到 Android 專案，並開啟 Android Studio |

## 📱 打包成 Android APK

### 1. 建立 Android 專案（第一次才需要）

`android/` 資料夾沒有放進 Git，clone 下來後要先產生：

```bash
npm run android:init
```

### 2. 編譯並開啟 Android Studio

```bash
npm run android
```

這個指令會自動：

1. 把網頁版本編譯到 `dist/`
2. 同步到 Android 專案
3. 開啟 Android Studio

### 3. 產生 APK

等 Android Studio 的 Gradle 跑完（第一次會比較久），然後：

1. 選單列點 **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. 跑完後右下角會跳出通知，點 **locate** 就能找到 APK
3. 檔案位置：`android/app/build/outputs/apk/debug/app-debug.apk`

把 APK 傳到手機上安裝即可（手機需要開啟「允許安裝不明來源的應用程式」）。

> 💡 不想開 Android Studio 的話，裝好 Android SDK 後也可以直接用指令打包：
>
> ```bash
> cd android
> ./gradlew assembleDebug
> ```

### 修改程式後重新打包

改完 `src/` 裡的程式碼後，再跑一次：

```bash
npm run android
```

然後在 Android Studio 重新 **Build APK** 就好。

### 正式版（簽名 APK／上架 Google Play）

在 Android Studio 選 **Build** → **Generate Signed Bundle / APK**，選擇 release 模式產生。

> ⚠️ 第一次要建立 keystore。**請務必備份 keystore 檔案和密碼**，弄丟就無法再更新已上架的 App。keystore 不要放進 Git。

## 🎨 自訂 App

| 想改的東西 | 怎麼改 |
| --- | --- |
| App 名稱 | 修改 `capacitor.config.json` 的 `appName` |
| 套件 ID（`com.xxx.xxx`） | 修改 `capacitor.config.json` 的 `appId`，改完要刪掉 `android/` 再重跑 `npm run android:init` |
| App 圖示 | 準備一張 1024×1024 的 PNG，命名為 `icon.png` 放在專案根目錄，然後執行：<br>`npm install -D @capacitor/assets`<br>`npx @capacitor/assets generate --android` |
| 鍋子空重預設值 | 修改 `src/App.jsx` 裡 `potEmptyWeight` 的初始值（目前是 `'247'`） |

## 📁 專案結構

```
RiceCal/
├── src/
│   ├── App.jsx           # 計算機主程式（畫面與計算邏輯）
│   ├── main.jsx          # React 進入點
│   ├── storage.js        # 資料儲存（包裝 localStorage）
│   └── index.css         # 全域樣式（Tailwind）
├── index.html            # 網頁進入點
├── capacitor.config.json # Capacitor 設定（App 名稱、套件 ID）
├── vite.config.js        # Vite 編譯設定
├── tailwind.config.js    # Tailwind 設定
├── postcss.config.js     # PostCSS 設定
├── package.json          # 套件與指令
└── android/              # 執行 android:init 後才會產生（不在 Git 中）
```

## 🧰 使用技術

- [React 18](https://react.dev)：介面
- [Vite 5](https://vitejs.dev)：開發伺服器與編譯工具
- [Tailwind CSS 3](https://tailwindcss.com)：樣式
- [Capacitor 6](https://capacitorjs.com)：把網頁打包成 Android App
