import React, { useState, useEffect } from 'react';
import { storage } from './storage.js';

export default function RiceCalculator() {
  const [myRice, setMyRice] = useState('');
  const [friendRice, setFriendRice] = useState('');
  const [potEmptyWeight, setPotEmptyWeight] = useState('247');
  const [baselinePot, setBaselinePot] = useState(null);
  const [currentPotWeight, setCurrentPotWeight] = useState('');
  const [percentage, setPercentage] = useState('');
  const [friendPercentage, setFriendPercentage] = useState('');
  const [splitMode, setSplitMode] = useState(false);
  const [meals, setMeals] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await storage.get('rice_settings');
        if (s) {
          const d = JSON.parse(s.value);
          if (d.myRice !== undefined) setMyRice(d.myRice);
          if (d.friendRice !== undefined) setFriendRice(d.friendRice);
          if (d.potEmptyWeight !== undefined) setPotEmptyWeight(d.potEmptyWeight);
        }
      } catch (e) {}
      try {
        const b = await storage.get('rice_baseline_pot');
        if (b) setBaselinePot(JSON.parse(b.value));
      } catch (e) {}
      try {
        const m = await storage.get('rice_meals');
        if (m) setMeals(JSON.parse(m.value));
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await storage.set(
          'rice_settings',
          JSON.stringify({ myRice, friendRice, potEmptyWeight })
        );
      } catch (e) {}
    })();
  }, [myRice, friendRice, potEmptyWeight, loaded]);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        if (baselinePot !== null) {
          await storage.set('rice_baseline_pot', JSON.stringify(baselinePot));
        } else {
          await storage.delete('rice_baseline_pot');
        }
      } catch (e) {}
    })();
  }, [baselinePot, loaded]);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await storage.set('rice_meals', JSON.stringify(meals));
      } catch (e) {}
    })();
  }, [meals, loaded]);

  // 基本參數
  const myU = parseFloat(myRice) || 0;
  const friendU = parseFloat(friendRice) || 0;
  const totalU = myU + friendU;
  const myRatio = totalU > 0 ? myU / totalU : 0;
  const emptyW = parseFloat(potEmptyWeight) || 0;

  const isFirstMeal = baselinePot === null;
  const mealNumber = meals.length + 1;

  // 初始份量（meal 1 存了之後就有）
  const initialCooked = baselinePot !== null ? Math.max(0, baselinePot - emptyW) : 0;
  const myInitialShare = initialCooked * myRatio;
  const friendInitialShare = initialCooked * (1 - myRatio);

  // 各自的剩餘比例（用每餐輸入的 % 累積算）
  let myRemProp = 1;
  let friendRemProp = 1;
  for (const m of meals) {
    myRemProp *= 1 - (m.myPct || 0);
    friendRemProp *= 1 - (m.friendPct || 0);
  }
  const myRemainingUncooked = myU * myRemProp;
  const friendRemainingUncooked = friendU * friendRemProp;
  const totalRemainingUncooked = myRemainingUncooked + friendRemainingUncooked;
  const dynamicRatio =
    totalRemainingUncooked > 0 ? myRemainingUncooked / totalRemainingUncooked : myRatio;

  // 累積已吃
  const myEatenTotal = meals.reduce((s, m) => s + (m.myAmount || 0), 0);
  const friendEatenTotal = meals.reduce((s, m) => s + (m.friendAmount || 0), 0);

  // 鍋重
  const cpw = parseFloat(currentPotWeight) || 0;
  const hasPotWeight = cpw > emptyW;
  const currentCooked = hasPotWeight ? cpw - emptyW : 0;

  // 這餐
  const myPct = parseFloat(percentage) || 0;
  const friendPctInput = parseFloat(friendPercentage) || 0;
  const effectiveFriendPct = splitMode ? friendPctInput : myPct;

  // 第一餐用初始比例，第二餐用動態比例（基於剩餘）
  const effectiveRatio = isFirstMeal ? myRatio : dynamicRatio;
  const myShare = currentCooked * effectiveRatio;
  const friendShare = currentCooked * (1 - effectiveRatio);
  const myMeal = myShare * myPct;
  const friendMeal = friendShare * effectiveFriendPct;

  // 這餐相當於原本的多少 % （顯示用）
  const myMealPctOfInitial =
    myInitialShare > 0 ? (myMeal / myInitialShare) * 100 : myPct * 100;
  const friendMealPctOfInitial =
    friendInitialShare > 0
      ? (friendMeal / friendInitialShare) * 100
      : effectiveFriendPct * 100;

  const hasRatio = myU > 0 && friendU > 0;
  const canCalculate =
    hasRatio &&
    hasPotWeight &&
    myPct > 0 &&
    (!splitMode || effectiveFriendPct > 0);

  // 快速分數建議（第二餐後用）
  // 若已吃 N/10，剩餘 (10-N)/10。要吃原本 X/10 → 輸入 X/(10-N)
  const myRemPortion10 = Math.round(myRemProp * 10);
  const friendRemPortion10 = Math.round(friendRemProp * 10);
  const quickFractions =
    !isFirstMeal && myRemPortion10 > 0 && myRemPortion10 <= 10
      ? [
          { label: `1/${myRemPortion10}`, value: 1 / myRemPortion10 },
          { label: `2/${myRemPortion10}`, value: 2 / myRemPortion10 },
          { label: `3/${myRemPortion10}`, value: 3 / myRemPortion10 },
          { label: '全部', value: 1 },
        ]
      : null;

  const logMeal = () => {
    if (!canCalculate) return;
    if (isFirstMeal) {
      setBaselinePot(cpw);
    }
    const newMeal = {
      id: Date.now(),
      mealNumber,
      method: isFirstMeal ? 'initial' : 'fraction',
      potWeight: cpw,
      myPct,
      friendPct: effectiveFriendPct,
      myAmount: myMeal,
      friendAmount: friendMeal,
      time: new Date().toLocaleString('zh-TW', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setMeals([...meals, newMeal]);
    setPercentage('');
    setFriendPercentage('');
    setCurrentPotWeight('');
  };

  const deleteMeal = (id) => {
    setMeals(meals.filter((m) => m.id !== id));
  };

  const clearAll = () => {
    setMeals([]);
    setBaselinePot(null);
    setPercentage('');
    setFriendPercentage('');
    setCurrentPotWeight('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 p-4 font-sans">
      <div className="max-w-md mx-auto">
        <header className="text-center mb-6 pt-4">
          <div className="text-5xl mb-2">🍚</div>
          <h1 className="text-2xl font-bold text-amber-900">白飯分配計算機</h1>
          <p className="text-sm text-amber-700 mt-1">
            第一餐 % 為初始 · 第二餐後 % 為剩餘
          </p>
        </header>

        {/* 白米量設定 */}
        <section className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <h2 className="text-sm font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <span className="text-base">⚖️</span> 白米量（克）
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-gray-600 mb-1 block">我的白米量</span>
              <input
                type="number"
                inputMode="decimal"
                value={myRice}
                onChange={(e) => setMyRice(e.target.value)}
                placeholder="例如 440"
                className="w-full px-3 py-2.5 border border-amber-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </label>
            <label className="block">
              <span className="text-xs text-gray-600 mb-1 block">朋友的白米量</span>
              <input
                type="number"
                inputMode="decimal"
                value={friendRice}
                onChange={(e) => setFriendRice(e.target.value)}
                placeholder="例如 160"
                className="w-full px-3 py-2.5 border border-amber-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </label>
          </div>
          {hasRatio && (
            <p className="text-xs text-amber-700 mt-3 bg-amber-50 px-3 py-2 rounded-lg">
              你佔 <span className="font-bold">{(myRatio * 100).toFixed(1)}%</span>　·　
              朋友佔 <span className="font-bold">{((1 - myRatio) * 100).toFixed(1)}%</span>
            </p>
          )}
        </section>

        {/* 基準資訊（第二餐之後顯示） */}
        {hasRatio && !isFirstMeal && (
          <section className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                <span className="text-base">🍲</span> 今日基準
              </h2>
              <button
                onClick={clearAll}
                className="text-xs text-amber-700 hover:text-amber-900 underline"
              >
                重新煮一鍋
              </button>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between text-gray-700">
                <span>整鍋重 / 初始飯量</span>
                <span>
                  {baselinePot} g / {initialCooked.toFixed(1)} g
                </span>
              </div>
              <div className="flex justify-between font-medium text-amber-900 pt-1 border-t border-amber-200">
                <span>你的初始份量</span>
                <span>{myInitialShare.toFixed(1)} g</span>
              </div>
              <div className="flex justify-between text-amber-800">
                <span>朋友的初始份量</span>
                <span>{friendInitialShare.toFixed(1)} g</span>
              </div>
              <div className="flex justify-between text-orange-700 pt-1 border-t border-amber-200">
                <span>你的剩餘比例</span>
                <span>
                  <span className="font-bold">{(myRemProp * 100).toFixed(1)}%</span>
                  {' '}({(myRemProp * 10).toFixed(1)}/10)
                </span>
              </div>
              <div className="flex justify-between text-orange-700">
                <span>朋友的剩餘比例</span>
                <span>
                  <span className="font-bold">{(friendRemProp * 100).toFixed(1)}%</span>
                  {' '}({(friendRemProp * 10).toFixed(1)}/10)
                </span>
              </div>
            </div>
          </section>
        )}

        {/* 這餐 */}
        {hasRatio && (
          <section className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                <span className="text-base">🥢</span> 第 {mealNumber} 餐
              </h2>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  isFirstMeal
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {isFirstMeal ? '初始份量法' : '剩餘份量法'}
              </span>
            </div>

            <div className="bg-amber-50 rounded-lg p-3 mb-3 text-xs text-amber-800">
              {isFirstMeal ? (
                <>
                  <p className="font-semibold mb-1">
                    第 1 餐 = (整鍋重 − {emptyW}) × 你的比例 × 這餐%
                  </p>
                  <p>輸入剛煮好的整鍋總重，% 是初始份量的 %</p>
                </>
              ) : (
                <>
                  <p className="font-semibold mb-1">
                    第 {mealNumber} 餐：% 是「剩餘份量」的 %
                  </p>
                  <p>
                    你已吃 {((1 - myRemProp) * 10).toFixed(1)}/10，剩 {(myRemProp * 10).toFixed(1)}/10。
                    要吃原本 30% 就輸入 <span className="font-mono font-bold">3/{(myRemProp * 10).toFixed(0)}</span>，
                    40% 就輸入 <span className="font-mono font-bold">4/{(myRemProp * 10).toFixed(0)}</span>
                  </p>
                </>
              )}
            </div>

            <label className="block mb-3">
              <span className="text-xs text-gray-600 mb-1 block">
                {isFirstMeal ? '整鍋總重（剛煮好，克）' : '目前鍋子總重（克）'}
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={currentPotWeight}
                onChange={(e) => setCurrentPotWeight(e.target.value)}
                placeholder={isFirstMeal ? '例如 1447' : '例如 1087'}
                className="w-full px-3 py-2.5 border border-amber-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <span className="text-xs text-gray-500 mt-1 block">會自動扣掉 {emptyW}g</span>
            </label>

            {/* 切換不同比例 */}
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-amber-100">
              <span className="text-xs text-gray-700">朋友吃不同比例</span>
              <button
                onClick={() => setSplitMode(!splitMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  splitMode ? 'bg-amber-500' : 'bg-gray-300'
                }`}
                aria-label="切換不同比例"
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                    splitMode ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {!splitMode ? (
              <label className="block">
                <span className="text-xs text-gray-600 mb-1 block">
                  {isFirstMeal ? '這餐比例（初始的 %，小數）' : '這餐比例（剩餘的 %，小數）'}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.0001"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  placeholder={isFirstMeal ? '例如 0.3' : '例如 0.4286（=3/7）'}
                  className="w-full px-3 py-2.5 border border-amber-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                {isFirstMeal ? (
                  <div className="flex gap-2 mt-2">
                    {[0.2, 0.3, 0.4].map((v) => (
                      <button
                        key={v}
                        onClick={() => setPercentage(String(v))}
                        className={`flex-1 py-2 text-sm rounded-lg transition font-medium ${
                          parseFloat(percentage) === v
                            ? 'bg-amber-500 text-white'
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                        }`}
                      >
                        {(v * 100).toFixed(0)}%
                      </button>
                    ))}
                  </div>
                ) : quickFractions ? (
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {quickFractions.map((f) => (
                      <button
                        key={f.label}
                        onClick={() => setPercentage(f.value.toFixed(4))}
                        className={`flex-1 min-w-[60px] py-2 text-sm rounded-lg transition font-medium ${
                          Math.abs(parseFloat(percentage) - f.value) < 0.0001
                            ? 'bg-amber-500 text-white'
                            : 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </label>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-gray-600 mb-1 block">你的比例</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.0001"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    placeholder="0.3"
                    className="w-full px-3 py-2.5 border border-amber-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-600 mb-1 block">朋友的比例</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.0001"
                    value={friendPercentage}
                    onChange={(e) => setFriendPercentage(e.target.value)}
                    placeholder="0.5"
                    className="w-full px-3 py-2.5 border border-amber-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </label>
              </div>
            )}
          </section>
        )}

        {/* 結果 */}
        {canCalculate ? (
          <section className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg mb-4">
            <p className="text-sm opacity-90 mb-3">
              第 {mealNumber} 餐 ·{' '}
              {splitMode
                ? `你 ${(myPct * 100).toFixed(1)}% · 朋友 ${(effectiveFriendPct * 100).toFixed(1)}%`
                : `${(myPct * 100).toFixed(1)}%${isFirstMeal ? '（初始）' : '（剩餘）'}`}
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-xs opacity-90 mb-1">你可以吃</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{myMeal.toFixed(1)}</span>
                  <span className="text-sm">g</span>
                </div>
                {!isFirstMeal && myInitialShare > 0 && (
                  <p className="text-xs mt-1 opacity-90">
                    = 原本 {myMealPctOfInitial.toFixed(1)}%
                  </p>
                )}
              </div>
              <div className="bg-white/20 rounded-xl p-3 backdrop-blur-sm">
                <p className="text-xs opacity-90 mb-1">朋友可以吃</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{friendMeal.toFixed(1)}</span>
                  <span className="text-sm">g</span>
                </div>
                {!isFirstMeal && friendInitialShare > 0 && (
                  <p className="text-xs mt-1 opacity-90">
                    = 原本 {friendMealPctOfInitial.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white/10 rounded-xl p-3 mb-4 text-sm space-y-1">
              <div className="flex justify-between opacity-95">
                <span>鍋內現有飯</span>
                <span>{currentCooked.toFixed(1)} g</span>
              </div>
              <div className="flex justify-between opacity-95">
                <span>你目前在鍋內</span>
                <span>{myShare.toFixed(1)} g</span>
              </div>
              <div className="flex justify-between opacity-95">
                <span>朋友目前在鍋內</span>
                <span>{friendShare.toFixed(1)} g</span>
              </div>
            </div>

            <button
              onClick={logMeal}
              className="w-full py-3 bg-white text-amber-700 font-bold rounded-xl hover:bg-amber-50 transition shadow"
            >
              這餐吃完了 ✓
            </button>
          </section>
        ) : hasRatio ? (
          <div className="bg-white/60 border-2 border-dashed border-amber-300 rounded-2xl p-6 text-center text-amber-700 text-sm mb-4">
            填好上面的欄位就會自動計算 ✨
          </div>
        ) : null}

        {/* 今日進度 */}
        {meals.length > 0 && (
          <section className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                <span className="text-base">📊</span> 今日進度
              </h2>
              <button
                onClick={clearAll}
                className="text-xs text-amber-700 hover:text-amber-900 underline"
              >
                重新煮一鍋
              </button>
            </div>

            <div className="space-y-3 mb-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-700 font-medium">你</span>
                  <span className="text-gray-600">
                    {myEatenTotal.toFixed(1)} / {myInitialShare.toFixed(1)} g（
                    {myInitialShare > 0
                      ? ((myEatenTotal / myInitialShare) * 100).toFixed(1)
                      : 0}
                    %）
                  </span>
                </div>
                <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (myEatenTotal / Math.max(0.001, myInitialShare)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-700 font-medium">朋友</span>
                  <span className="text-gray-600">
                    {friendEatenTotal.toFixed(1)} / {friendInitialShare.toFixed(1)} g（
                    {friendInitialShare > 0
                      ? ((friendEatenTotal / friendInitialShare) * 100).toFixed(1)
                      : 0}
                    %）
                  </span>
                </div>
                <div className="w-full bg-orange-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-orange-500 h-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        (friendEatenTotal / Math.max(0.001, friendInitialShare)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-amber-100">
              {meals.map((m, i) => {
                const samePct = Math.abs((m.myPct || 0) - (m.friendPct || 0)) < 0.001;
                return (
                  <div
                    key={m.id}
                    className="flex items-center justify-between text-xs bg-amber-50 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-amber-700 font-semibold">第 {i + 1} 餐</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          m.method === 'initial'
                            ? 'bg-amber-200 text-amber-800'
                            : 'bg-orange-200 text-orange-800'
                        }`}
                      >
                        {m.method === 'initial' ? '初始' : '剩餘'}
                      </span>
                      <span className="text-gray-500">{m.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700">
                        {samePct ? (
                          <>
                            {m.myAmount.toFixed(1)} / {m.friendAmount.toFixed(1)} g
                            <span className="text-amber-600 ml-1">
                              ({((m.myPct || 0) * 100).toFixed(1)}%)
                            </span>
                          </>
                        ) : (
                          <>
                            {m.myAmount.toFixed(1)}g ({((m.myPct || 0) * 100).toFixed(1)}%) /{' '}
                            {m.friendAmount.toFixed(1)}g ({((m.friendPct || 0) * 100).toFixed(1)}%)
                          </>
                        )}
                      </span>
                      <button
                        onClick={() => deleteMeal(m.id)}
                        className="text-gray-400 hover:text-red-500 text-base leading-none ml-1"
                        aria-label="刪除"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 進階設定 */}
        <div className="mt-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full text-xs text-amber-700 py-2 hover:text-amber-900 transition"
          >
            {showSettings ? '▲ 收起進階設定' : '▼ 進階設定'}
          </button>
          {showSettings && (
            <section className="bg-white rounded-2xl p-5 shadow-sm">
              <label className="block">
                <span className="text-xs text-gray-600 mb-1 block">鍋子空重（克）</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={potEmptyWeight}
                  onChange={(e) => setPotEmptyWeight(e.target.value)}
                  className="w-full px-3 py-2.5 border border-amber-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-xs text-gray-500 mt-1 block">預設 247g</span>
              </label>
            </section>
          )}
        </div>

        <p className="text-xs text-center text-amber-600 mt-6 pb-4">
          所有資料會自動記住 · 新的一鍋飯按「重新煮一鍋」 🌾
        </p>
      </div>
    </div>
  );
}
