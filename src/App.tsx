import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, DollarSign, Search, Filter, Settings, Download, Upload, GripVertical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

interface SortableSubscriptionCardProps {
  subscription: Subscription;
  onEdit: (sub: Subscription) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
}

function SortableSubscriptionCard({ subscription, onEdit, onDelete, onToggleActive }: SortableSubscriptionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subscription.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border-2 border-black neobrutalism-shadow p-4 sm:p-5 transition-all ${
        isDragging ? 'z-50 shadow-xl' : 'hover:translate-x-1 hover:translate-y-1 hover:shadow-none'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-2">
          <button
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 border-2 border-black transition"
            {...attributes}
            {...listeners}
          >
            <GripVertical size={18} className="text-gray-400" />
          </button>
          <Switch
            checked={subscription.isActive !== false}
            onCheckedChange={() => onToggleActive(subscription.id)}
            className="mt-1"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 break-words">{subscription.name}</h3>
            {subscription.category && (
              <span className="bg-indigo-100 text-indigo-700 border-2 border-black px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-bold whitespace-nowrap">
                {subscription.category}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(subscription)}
            className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 border-2 border-black transition active:scale-95"
            aria-label="編集"
          >
            <Edit2 size={18} className="sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => onDelete(subscription.id)}
            className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 border-2 border-black transition active:scale-95"
            aria-label="削除"
          >
            <Trash2 size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-baseline gap-2 sm:gap-4 text-sm text-gray-600">
        <span className="font-bold text-indigo-600 text-base sm:text-lg">
          ¥{subscription.price.toLocaleString()}
        </span>
        <span className="text-gray-500">
          {subscription.billingCycle === 'monthly' ? '/ 月' : '/ 年'}
        </span>
        {subscription.billingCycle === 'yearly' && (
          <span className="text-gray-400 text-xs sm:text-sm">
            (月額換算: ¥{Math.round(subscription.price / 12).toLocaleString()})
          </span>
        )}
      </div>
    </div>
  );
}

function AppContent() {
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription, reorderSubscriptions, toggleActive } = useSubscriptions();
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['すべて', 'エンタメ', '音楽', '仕事', 'クラウド', 'その他'];

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = subscriptions.findIndex((sub) => sub.id === active.id);
      const newIndex = subscriptions.findIndex((sub) => sub.id === over.id);

      const reordered = arrayMove(subscriptions, oldIndex, newIndex);
      reorderSubscriptions(reordered);
    }
  };

  // Load templates from local CSV
  useEffect(() => {
    const baseUrl = import.meta.env.BASE_URL || '/';
    fetch(`${baseUrl}templates.csv`)
      .then(response => response.text())
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
      .catch(err => console.error('Failed to load templates:', err));
  }, []);

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

  const activeSubscriptions = subscriptions.filter((sub) => sub.isActive !== false);

  const monthlyTotal = activeSubscriptions.reduce((sum, sub) => {
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

        // Directly manipulate localStorage to avoid async mutation issues
        const STORAGE_KEY = 'subplanner_subscriptions';
        let finalSubscriptions: Subscription[];

        if (shouldReplace) {
          // Replace all with imported data
          finalSubscriptions = importedSubs;
        } else {
          // Add to existing
          finalSubscriptions = [...subscriptions, ...importedSubs];
        }

        // Save to localStorage and trigger re-fetch
        localStorage.setItem(STORAGE_KEY, JSON.stringify(finalSubscriptions));

        // Force query refetch
        window.location.reload();
      }
    };

    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border-4 border-black neobrutalism-shadow-xl p-4 sm:p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3">
              <DollarSign className="text-indigo-600" size={32} />
              サブスク管理
            </h1>
            {!isAdding && (
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowSettings(true)}
                  className="bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 sm:py-3 border-4 border-black neobrutalism-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2 font-bold text-sm sm:text-base flex-1 sm:flex-initial justify-center"
                >
                  <Settings size={18} className="sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">設定</span>
                </button>
                <button
                  onClick={() => {
                    setIsAdding(true);
                    setShowTemplates(true);
                  }}
                  className="bg-indigo-600 text-white px-4 sm:px-6 py-2 sm:py-3 border-4 border-black neobrutalism-shadow hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2 font-bold text-sm sm:text-base flex-1 sm:flex-initial justify-center"
                >
                  <Plus size={18} className="sm:w-5 sm:h-5" />
                  追加
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8">
            <div className="bg-gradient-to-br from-green-400 to-green-500 border-4 border-black neobrutalism-shadow p-4 sm:p-6 text-white">
              <p className="text-green-50 text-xs sm:text-sm mb-1 font-semibold">月額合計</p>
              <p className="text-2xl sm:text-3xl font-bold">¥{monthlyTotal.toLocaleString()}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-400 to-purple-500 border-4 border-black neobrutalism-shadow p-4 sm:p-6 text-white">
              <p className="text-purple-50 text-xs sm:text-sm mb-1 font-semibold">年額合計</p>
              <p className="text-2xl sm:text-3xl font-bold">¥{yearlyTotal.toLocaleString()}</p>
            </div>
          </div>

          {isAdding && showTemplates && !isCustom && (
            <div className="bg-gray-50 border-4 border-black neobrutalism-shadow p-4 sm:p-6 mb-6">
              <h3 className="text-base sm:text-lg font-bold mb-4 text-gray-800">
                サブスクを選択
              </h3>

              <div className="mb-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="サービス名で検索"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border-2 border-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                  <Filter size={16} className="text-gray-500 flex-shrink-0" />
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-bold whitespace-nowrap transition border-2 border-black min-w-[60px] ${
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

              <div className="border-4 border-black neobrutalism-shadow bg-gray-50 mb-4 p-1">
                <div className="max-h-80 overflow-y-auto bg-white border-2 border-black p-3 neobrutalism-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {filteredTemplates.length > 0 ? (
                      filteredTemplates.map((template, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleTemplateSelect(template)}
                          className="bg-white border-2 border-black p-3 sm:p-4 hover:border-indigo-500 hover:neobrutalism-shadow transition text-left min-h-[120px] active:scale-95"
                        >
                          <div className="text-2xl sm:text-3xl mb-2">{template.icon}</div>
                          <div className="font-bold text-gray-800 mb-1 text-xs sm:text-sm break-words">{template.name}</div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            {template.price === 0 ? '無料' : `¥${template.price.toLocaleString()}`} / {template.cycle === 'monthly' ? '月' : '年'}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{template.category}</div>
                        </button>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-8 text-gray-500 text-sm">
                        該当するサービスが見つかりませんでした
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t-4 border-black pt-4">
                <p className="text-xs text-gray-500 mb-3">見つからない場合は、カスタム追加で手動登録できます</p>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      setShowTemplates(false);
                      setIsCustom(true);
                    }}
                    className="bg-white border-2 border-indigo-600 text-indigo-600 px-6 py-2 hover:bg-indigo-50 transition font-bold text-sm sm:text-base"
                  >
                    カスタム追加
                  </button>
                  <button
                    onClick={handleCancel}
                    className="bg-gray-300 border-2 border-black text-gray-700 px-6 py-2 hover:bg-gray-400 transition font-bold text-sm sm:text-base"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            </div>
          )}

          {isAdding && isCustom && (
            <div className="bg-gray-50 border-4 border-black neobrutalism-shadow p-4 sm:p-6 mb-6">
              <h3 className="text-base sm:text-lg font-bold mb-4 text-gray-800">
                {editingId ? 'サブスクを編集' : '新規サブスク追加'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                    サービス名
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Netflix"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                    料金（円）
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="1490"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                    支払いサイクル
                  </label>
                  <select
                    value={formData.billingCycle}
                    onChange={(e) => setFormData({...formData, billingCycle: e.target.value as 'monthly' | 'yearly'})}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="monthly">月額</option>
                    <option value="yearly">年額</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">
                    カテゴリ
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-black focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">選択してください</option>
                    {categories.filter(c => c !== 'すべて').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={handleSubmit}
                  className="bg-indigo-600 text-white border-2 border-black px-6 py-2 hover:bg-indigo-700 transition font-bold text-sm sm:text-base"
                >
                  {editingId ? '更新' : '追加'}
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-gray-300 border-2 border-black text-gray-700 px-6 py-2 hover:bg-gray-400 transition font-bold text-sm sm:text-base"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-3">
              {subscriptions.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm sm:text-base">
                  サブスクが登録されていません
                </p>
              ) : (
                <SortableContext
                  items={subscriptions.map(sub => sub.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {subscriptions.map(sub => (
                    <SortableSubscriptionCard
                      key={sub.id}
                      subscription={sub}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleActive={toggleActive}
                    />
                  ))}
                </SortableContext>
              )}
            </div>
          </DndContext>

          {/* Settings Dialog */}
          {showSettings && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-6"
              onClick={() => setShowSettings(false)}
            >
              <div
                className="bg-white border-4 border-black neobrutalism-shadow-xl p-4 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800">設定</h2>
                <div className="space-y-4">
                  {/* CSV Export/Import Section */}
                  <div>
                    <h3 className="text-base sm:text-lg font-bold mb-3 text-gray-800">データ管理</h3>
                    <div className="space-y-2">
                      <button
                        onClick={handleExportCSV}
                        disabled={subscriptions.length === 0}
                        className="w-full bg-green-600 text-white border-2 border-black px-4 py-2 hover:bg-green-700 transition font-bold text-xs sm:text-sm disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Download size={16} className="sm:w-[18px] sm:h-[18px]" />
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
                        className="w-full bg-blue-600 text-white border-2 border-black px-4 py-2 hover:bg-blue-700 transition font-bold text-xs sm:text-sm flex items-center justify-center gap-2"
                      >
                        <Upload size={16} className="sm:w-[18px] sm:h-[18px]" />
                        CSVをインポート
                      </button>

                      <p className="text-xs text-gray-500 mt-2">
                        ※ インポート時、既存データの上書きまたは追加を選択できます
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="bg-gray-300 border-2 border-black text-gray-700 px-4 sm:px-6 py-2 hover:bg-gray-400 transition font-bold text-sm sm:text-base"
                  >
                    閉じる
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