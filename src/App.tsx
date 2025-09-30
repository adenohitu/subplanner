import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, DollarSign, Search, Filter, Settings, Download, Upload } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import type { Subscription } from '@/types/subscription';
import { exportSubscriptionsToCSV, parseCSVToSubscriptions } from '@/lib/csv';

const queryClient = new QueryClient();

interface Template {
  name: string;
  price: number;
  cycle: 'monthly' | 'yearly';
  category: string;
  icon: string;
}

function AppContent() {
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription } = useSubscriptions();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    billingCycle: 'monthly' as 'monthly' | 'yearly',
    nextBillingDate: '',
    category: ''
  });
  const [showTemplates, setShowTemplates] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('すべて');
  const [showSettings, setShowSettings] = useState(false);
  const [sheetId, setSheetId] = useState('');
  const [sheetGid, setSheetGid] = useState('');
  const [tempSheetId, setTempSheetId] = useState('');
  const [tempSheetGid, setTempSheetGid] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['すべて', 'エンタメ', '音楽', '仕事', 'クラウド', 'その他'];
  const defaultSheetId = 'YOUR_SHEET_ID';
  const defaultSheetGid = '305368109';

  // Load sheet ID/GID from localStorage
  useEffect(() => {
    const storedId = localStorage.getItem('sheetId');
    const storedGid = localStorage.getItem('sheetGid');
    if (storedId && storedGid) {
      setSheetId(storedId);
      setSheetGid(storedGid);
      setTempSheetId(storedId);
      setTempSheetGid(storedGid);
    } else {
      // Set default sheet ID/GID on first load
      setSheetId(defaultSheetId);
      setSheetGid(defaultSheetGid);
      setTempSheetId(defaultSheetId);
      setTempSheetGid(defaultSheetGid);
    }
  }, []);

  // Save sheet ID/GID to localStorage
  useEffect(() => {
    if (sheetId && sheetGid) {
      localStorage.setItem('sheetId', sheetId);
      localStorage.setItem('sheetGid', sheetGid);
    }
  }, [sheetId, sheetGid]);

  // Load templates from CSV or Google Sheets
  useEffect(() => {
    if (!sheetId || !sheetGid) return;

    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${sheetGid}`;
    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then(text => {
        const lines = text.split('\n').slice(1); // Skip header
        const parsedTemplates = lines
          .filter(line => line.trim())
          .map(line => {
            const [name, price, cycle, category, icon] = line.split(',');
            return {
              name: name.trim(),
              price: Number(price.trim()),
              cycle: cycle.trim() as 'monthly' | 'yearly',
              category: category.trim(),
              icon: icon.trim()
            };
          });
        setTemplates(parsedTemplates);
      })
      .catch(err => {
        console.error('Failed to load templates:', err);
        // Fallback to local CSV if custom Google Sheets fails
        const isCustomSheet = sheetId !== defaultSheetId || sheetGid !== defaultSheetGid;
        if (isCustomSheet) {
          fetch('/templates.csv')
            .then(response => response.text())
            .then(text => {
              const lines = text.split('\n').slice(1);
              const parsedTemplates = lines
                .filter(line => line.trim())
                .map(line => {
                  const [name, price, cycle, category, icon] = line.split(',');
                  return {
                    name: name.trim(),
                    price: Number(price.trim()),
                    cycle: cycle.trim() as 'monthly' | 'yearly',
                    category: category.trim(),
                    icon: icon.trim()
                  };
                });
              setTemplates(parsedTemplates);
            })
            .catch(fallbackErr => console.error('Fallback also failed:', fallbackErr));
        }
      });
  }, [sheetId, sheetGid]);

  const handleTemplateSelect = (template: Template) => {
    const nextDate = new Date();
    nextDate.setMonth(nextDate.getMonth() + (template.cycle === 'monthly' ? 1 : 12));

    addSubscription({
      name: template.name,
      price: template.price,
      billingCycle: template.cycle,
      nextBillingDate: nextDate.toISOString().split('T')[0],
      category: template.category
    });
    setShowTemplates(false);
    setIsAdding(false);
    setSearchQuery('');
    setSelectedCategory('すべて');
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.price || !formData.category) return;

    const nextDate = formData.nextBillingDate || (() => {
      const date = new Date();
      date.setMonth(date.getMonth() + (formData.billingCycle === 'monthly' ? 1 : 12));
      return date.toISOString().split('T')[0];
    })();

    if (editingId) {
      updateSubscription({
        id: editingId,
        name: formData.name,
        price: Number(formData.price),
        billingCycle: formData.billingCycle,
        nextBillingDate: nextDate,
        category: formData.category
      });
      setEditingId(null);
    } else {
      addSubscription({
        name: formData.name,
        price: Number(formData.price),
        billingCycle: formData.billingCycle,
        nextBillingDate: nextDate,
        category: formData.category
      });
    }
    setFormData({ name: '', price: '', billingCycle: 'monthly', nextBillingDate: '', category: '' });
    setIsAdding(false);
    setIsCustom(false);
  };

  const handleEdit = (sub: Subscription) => {
    setFormData({
      name: sub.name,
      price: sub.price.toString(),
      billingCycle: sub.billingCycle,
      nextBillingDate: sub.nextBillingDate,
      category: sub.category || ''
    });
    setEditingId(sub.id);
    setIsAdding(true);
    setIsCustom(true);
    setShowTemplates(false);
  };

  const handleDelete = (id: string) => {
    deleteSubscription(id);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setShowTemplates(false);
    setIsCustom(false);
    setSearchQuery('');
    setSelectedCategory('すべて');
    setFormData({ name: '', price: '', billingCycle: 'monthly', nextBillingDate: '', category: '' });
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'すべて' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const monthlyTotal = subscriptions.reduce((sum, sub) => {
    return sum + (sub.billingCycle === 'monthly' ? sub.price : sub.price / 12);
  }, 0);

  const yearlyTotal = monthlyTotal * 12;

  // CSV Export
  const handleExportCSV = () => {
    exportSubscriptionsToCSV(subscriptions);
  };

  // CSV Import
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { subscriptions: importedSubs, errors } = parseCSVToSubscriptions(text);

      if (errors.length > 0) {
        alert(`CSVインポート中にエラーが発生しました:\n\n${errors.join('\n')}`);
      }

      if (importedSubs.length > 0) {
        const shouldReplace = window.confirm(
          `${importedSubs.length}件のサブスクリプションをインポートします。\n\nOK: 既存データを上書き\nキャンセル: 既存データに追加`
        );

        if (shouldReplace) {
          // Replace all: clear existing and add imported
          subscriptions.forEach(sub => deleteSubscription(sub.id));
          importedSubs.forEach(sub => addSubscription(sub));
        } else {
          // Add to existing
          importedSubs.forEach(sub => addSubscription(sub));
        }

        alert(`${importedSubs.length}件のサブスクリプションをインポートしました。`);
      }
    };

    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border-4 border-black neobrutalism-shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <DollarSign className="text-indigo-600" size={36} />
              サブスク管理
            </h1>
            {!isAdding && (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSettings(true)}
                  className="bg-gray-200 text-gray-700 px-4 py-3 border-4 border-black neobrutalism-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2 font-bold"
                >
                  <Settings size={20} />
                  設定
                </button>
                <button
                  onClick={() => {
                    setIsAdding(true);
                    setShowTemplates(true);
                  }}
                  className="bg-indigo-600 text-white px-6 py-3 border-4 border-black neobrutalism-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2 font-bold"
                >
                  <Plus size={20} />
                  追加
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-400 to-green-500 border-4 border-black neobrutalism-shadow p-6 text-white">
              <p className="text-green-50 text-sm mb-1 font-semibold">月額合計</p>
              <p className="text-3xl font-bold">¥{monthlyTotal.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-400 to-purple-500 border-4 border-black neobrutalism-shadow p-6 text-white">
              <p className="text-purple-50 text-sm mb-1 font-semibold">年額合計</p>
              <p className="text-3xl font-bold">¥{yearlyTotal.toLocaleString()}</p>
            </div>
          </div>

          {isAdding && showTemplates && !isCustom && (
            <div className="bg-gray-50 border-4 border-black neobrutalism-shadow p-6 mb-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800">
                サブスクを選択
              </h3>

              <div className="mb-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="サービス名で検索（例: Netflix, Spotify）"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <Filter size={18} className="text-gray-500 flex-shrink-0" />
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-1.5 text-sm font-bold whitespace-nowrap transition border-2 border-black ${
                        selectedCategory === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 max-h-80 overflow-y-auto custom-scrollbar">
                {filteredTemplates.length > 0 ? (
                  filteredTemplates.map((template, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTemplateSelect(template)}
                      className="bg-white border-2 border-black p-4 hover:border-indigo-500 hover:neobrutalism-shadow transition text-left"
                    >
                      <div className="text-3xl mb-2">{template.icon}</div>
                      <div className="font-bold text-gray-800 mb-1 text-sm">{template.name}</div>
                      <div className="text-sm text-gray-600">
                        {template.price === 0 ? '無料' : `¥${template.price.toLocaleString()}`} / {template.cycle === 'monthly' ? '月' : '年'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{template.category}</div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    該当するサービスが見つかりませんでした
                  </div>
                )}
              </div>

              <div className="border-t-4 border-black pt-4">
                <p className="text-xs text-gray-500 mb-3">見つからない場合は、カスタム追加で手動登録できます</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowTemplates(false);
                      setIsCustom(true);
                    }}
                    className="bg-white border-2 border-indigo-600 text-indigo-600 px-6 py-2 hover:bg-indigo-50 transition font-bold"
                  >
                    カスタム追加
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-300 border-2 border-black text-gray-700 px-6 py-2 hover:bg-gray-400 transition font-bold"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}

          {isAdding && isCustom && (
            <div className="bg-gray-50 border-4 border-black neobrutalism-shadow p-6 mb-6">
              <h3 className="text-lg font-bold mb-4 text-gray-800">
                {editingId ? 'サブスクを編集' : '新規サブスク追加'}
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    サービス名
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Netflix"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    料金（円）
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="1490"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    支払いサイクル
                  </label>
                  <select
                    value={formData.billingCycle}
                    onChange={(e) => setFormData({...formData, billingCycle: e.target.value as 'monthly' | 'yearly'})}
                    className="w-full px-4 py-2 border-2 border-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="monthly">月額</option>
                    <option value="yearly">年額</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    カテゴリ
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-4 py-2 border-2 border-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">選択してください</option>
                    {categories.filter(c => c !== 'すべて').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSubmit}
                  className="bg-indigo-600 text-white border-2 border-black px-6 py-2 hover:bg-indigo-700 transition font-bold"
                >
                  {editingId ? '更新' : '追加'}
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-300 border-2 border-black text-gray-700 px-6 py-2 hover:bg-gray-400 transition font-bold"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {subscriptions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                サブスクが登録されていません
              </p>
            ) : (
              subscriptions.map(sub => (
                <div
                  key={sub.id}
                  className="bg-white border-2 border-black neobrutalism-shadow p-5 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-800">{sub.name}</h3>
                      {sub.category && (
                        <span className="bg-indigo-100 text-indigo-700 border-2 border-black px-3 py-1 text-xs font-bold">
                          {sub.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="font-bold text-indigo-600 text-lg">
                        ¥{sub.price.toLocaleString()}
                      </span>
                      <span className="text-gray-500">
                        {sub.billingCycle === 'monthly' ? '/ 月' : '/ 年'}
                      </span>
                      {sub.billingCycle === 'yearly' && (
                        <span className="text-gray-400 text-xs">
                          (月額換算: ¥{Math.round(sub.price / 12).toLocaleString()})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(sub)}
                      className="p-2 text-blue-600 hover:bg-blue-50 border-2 border-black transition"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="p-2 text-red-600 hover:bg-red-50 border-2 border-black transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Settings Dialog */}
          {showSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
              <div className="bg-white border-4 border-black neobrutalism-shadow-xl p-6 max-w-lg w-full">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">設定</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      スプレッドシート ID
                    </label>
                    <input
                      type="text"
                      value={tempSheetId}
                      onChange={(e) => setTempSheetId(e.target.value)}
                      placeholder="YOUR_SHEET_ID"
                      className="w-full px-4 py-2 border-2 border-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-2"
                    />
                    <p className="text-xs text-gray-600 mb-4">
                      URLの<code className="bg-gray-100 px-1">/d/</code>と<code className="bg-gray-100 px-1">/edit</code>の間の文字列
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      シート GID（オプション）
                    </label>
                    <input
                      type="text"
                      value={tempSheetGid}
                      onChange={(e) => setTempSheetGid(e.target.value)}
                      placeholder="0"
                      className="w-full px-4 py-2 border-2 border-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-2"
                    />
                    <p className="text-xs text-gray-600">
                      URLの<code className="bg-gray-100 px-1">gid=</code>の後の数字（通常は0）
                    </p>
                  </div>
                  <div className="bg-yellow-50 border-2 border-yellow-300 p-3 text-xs text-gray-700">
                    <strong>注意:</strong> スプレッドシートは「ファイル → 共有 → ウェブに公開」で公開設定する必要があります。
                  </div>

                  {/* CSV Export/Import Section */}
                  <div className="border-t-4 border-black pt-4">
                    <h3 className="text-lg font-bold mb-3 text-gray-800">データ管理</h3>
                    <div className="space-y-2">
                      <button
                        onClick={handleExportCSV}
                        disabled={subscriptions.length === 0}
                        className="w-full bg-green-600 text-white border-2 border-black px-4 py-2 hover:bg-green-700 transition font-bold disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Download size={18} />
                        CSVで書き出し ({subscriptions.length}件)
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleImportCSV}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-blue-600 text-white border-2 border-black px-4 py-2 hover:bg-blue-700 transition font-bold flex items-center justify-center gap-2"
                      >
                        <Upload size={18} />
                        CSVをインポート
                      </button>

                      <p className="text-xs text-gray-500 mt-2">
                        ※ インポート時、既存データの上書きまたは追加を選択できます
                      </p>
                    </div>
                  </div>
                  {sheetId && sheetGid && (
                    <div className="bg-blue-50 border-2 border-blue-300 p-3 text-xs">
                      <strong>現在の設定:</strong>
                      <div className="mt-1 space-y-1">
                        <div className="font-mono text-blue-900">ID: {sheetId}</div>
                        <div className="font-mono text-blue-900">GID: {sheetGid}</div>
                        <div className="mt-2 pt-2 border-t border-blue-300">
                          <strong>リンク:</strong>
                          <div className="mt-1">
                            <a
                              href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit#gid=${sheetGid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline break-all"
                            >
                              スプレッドシートを開く
                            </a>
                          </div>
                          <div className="mt-1">
                            <a
                              href={`https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${sheetGid}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline break-all"
                            >
                              CSVをダウンロード
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      if (tempSheetId.trim() && tempSheetGid.trim()) {
                        setSheetId(tempSheetId.trim());
                        setSheetGid(tempSheetGid.trim());
                        setShowSettings(false);
                      }
                    }}
                    className="bg-indigo-600 text-white border-2 border-black px-6 py-2 hover:bg-indigo-700 transition font-bold"
                  >
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setSheetId(defaultSheetId);
                      setSheetGid(defaultSheetGid);
                      setTempSheetId(defaultSheetId);
                      setTempSheetGid(defaultSheetGid);
                      setShowSettings(false);
                    }}
                    className="bg-gray-300 border-2 border-black text-gray-700 px-6 py-2 hover:bg-gray-400 transition font-bold"
                  >
                    デフォルトに戻す
                  </button>
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      setTempSheetId(sheetId);
                      setTempSheetGid(sheetGid);
                    }}
                    className="bg-gray-300 border-2 border-black text-gray-700 px-6 py-2 hover:bg-gray-400 transition font-bold"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}