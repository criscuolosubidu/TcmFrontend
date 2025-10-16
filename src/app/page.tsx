'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import PatientList from '@/components/PatientList';
import PatientCard from '@/components/PatientCard';
import ASRComponent from '@/components/ASRComponent';
import QRScannerComponent from '@/components/QRScannerComponent';
import { PrescriptionRecord } from '@/types';
import { ASRConfig } from '@/types/asr';
import { 
  Activity, TrendingUp, Clock, CheckCircle, 
  FileText, Stethoscope, Users, AlertCircle,
  BarChart3, Settings, RefreshCw, Database, Info,
  GripVertical, Mic, QrCode
} from 'lucide-react';
import { PrescriptionFileLoader, DataSource } from '@/utils/fileDiscovery';

export default function Home() {
  const [records, setRecords] = useState<PrescriptionRecord[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);
  const [showDataSources, setShowDataSources] = useState(false);
  const [showASR, setShowASR] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);
  
  // 拖拽相关状态
  const [leftPanelWidth, setLeftPanelWidth] = useState(320); // 默认宽度
  const [isLeftDragging, setIsLeftDragging] = useState(false);
  const [asrPanelHeight, setAsrPanelHeight] = useState(280); // ASR面板默认高度
  const [isAsrDragging, setIsAsrDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ASR 配置 - 请替换为您的实际科大讯飞ASR凭据
  const [asrConfig] = useState<ASRConfig>({
    appId: process.env.NEXT_PUBLIC_XFYUN_APP_ID || '654ddfbc', // 从环境变量获取或使用默认值
    apiKey: process.env.NEXT_PUBLIC_XFYUN_API_KEY || 'aa0b46943a8329b4de56a662341dfd88', // 从环境变量获取或使用默认值
    sampleRate: 16000,
    frameSize: 1024
  });

  useEffect(() => {
    // 加载处方数据
    const loadData = async () => {
      try {
        const loader = new PrescriptionFileLoader();
        const { records: loadedRecords, sources } = await loader.loadAllPrescriptionFiles();
        
        setRecords(loadedRecords);
        setDataSources(sources);
        setLoading(false);
        
        // 打印加载信息
        console.log(`成功加载 ${loadedRecords.length} 条处方记录`);
        console.log(`数据源: ${sources.filter(s => s.success).length} 个成功，${sources.filter(s => !s.success).length} 个失败`);
        
        // 显示成功通知
        if (loadedRecords.length > 0) {
          setGlobalSuccess(`成功加载 ${loadedRecords.length} 条处方记录`);
          setTimeout(() => setGlobalSuccess(null), 3000);
        }
      } catch (error) {
        console.error('Failed to load prescription data:', error);
        setRecords([]);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleUpdateRecord = (updatedRecord: PrescriptionRecord) => {
    const newRecords = [...records];
    newRecords[selectedIndex] = updatedRecord;
    setRecords(newRecords);
  };

  // ASR 处理函数
  const handleASRResult = useCallback((text: string) => {
    console.log('ASR识别结果:', text);
    // 可以在这里处理识别结果，比如填充到当前病历的某个字段
  }, []);

  const handleASRError = useCallback((error: string) => {
    console.error('ASR错误:', error);
    setGlobalError(`语音识别错误: ${error}`);
    // 5秒后自动清除错误提示
    setTimeout(() => setGlobalError(null), 5000);
  }, []);

  const handleASRStatusChange = useCallback((status: string) => {
    console.log('ASR状态变更:', status);
  }, []);

  // 二维码扫描处理函数
  const handleQRScanSuccess = useCallback((decodedText: string, decodedResult: any) => {
    console.log('二维码扫描成功:', decodedText);
    
    try {
      // 尝试解析JSON格式的病人信息
      const patientInfo = JSON.parse(decodedText);
      
      // 显示成功消息
      const displayName = patientInfo.姓名 || patientInfo.name || patientInfo.病历号 || patientInfo.id || '未知';
      setGlobalSuccess(`成功扫描病人信息: ${displayName}`);
      setTimeout(() => setGlobalSuccess(null), 3000);
      
      // 尝试在现有记录中查找该病人（根据诊断、主诉或其他关键信息）
      const searchKeys = [
        patientInfo.姓名,
        patientInfo.name,
        patientInfo.病历号,
        patientInfo.id,
        patientInfo.诊断,
        patientInfo.diagnosis
      ].filter(Boolean);
      
      if (searchKeys.length > 0) {
        const foundIndex = records.findIndex(record => {
          const searchableFields = [
            record.输入诊断,
            record.原始记录?.原始病历?.诊断,
            record.原始记录?.原始病历?.主诉,
            record.输入病历
          ].filter(Boolean).join(' ');
          
          return searchKeys.some(key => 
            searchableFields.includes(key as string)
          );
        });
        
        if (foundIndex !== -1) {
          setSelectedIndex(foundIndex);
          setGlobalSuccess(`已找到病人记录，跳转到第 ${foundIndex + 1} 条`);
          setTimeout(() => setGlobalSuccess(null), 3000);
        } else {
          setGlobalError(`未找到匹配的病人记录`);
          setTimeout(() => setGlobalError(null), 5000);
        }
      }
      
      console.log('解析的病人信息:', patientInfo);
    } catch (error) {
      // 如果不是JSON格式，直接显示原始文本并尝试搜索
      setGlobalSuccess(`扫描到内容，正在搜索...`);
      
      // 尝试在记录中搜索这个文本
      const foundIndex = records.findIndex(record => {
        const searchableFields = [
          record.输入诊断,
          record.原始记录?.原始病历?.诊断,
          record.原始记录?.原始病历?.主诉,
          record.输入病历
        ].filter(Boolean).join(' ');
        
        return searchableFields.includes(decodedText);
      });
      
      if (foundIndex !== -1) {
        setSelectedIndex(foundIndex);
        setGlobalSuccess(`已找到相关记录，跳转到第 ${foundIndex + 1} 条`);
      } else {
        setGlobalError(`未找到包含"${decodedText}"的记录`);
      }
      
      setTimeout(() => {
        setGlobalSuccess(null);
        setGlobalError(null);
      }, 5000);
    }
  }, [records]);

  // 统计信息
  const stats = {
    total: records.length,
    success: records.filter(r => r.生成状态 === '成功').length,
    failed: records.filter(r => r.生成状态 === '失败').length,
    processing: records.filter(r => r.生成状态 === '处理中').length,
    withPrescription: records.filter(r => r.处方结果 && r.处方结果.trim() !== '').length,
    avgProcessingTime: records.length > 0 
      ? (records.reduce((sum, r) => sum + r.处理时间, 0) / records.length).toFixed(1)
      : '0',
    dataSources: dataSources.filter(s => s.success).length,
    totalSources: dataSources.length,
  };

  const StatCard = ({ title, value, icon: Icon, color, description }: {
    title: string;
    value: string | number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    description?: string;
  }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );

  const DataSourceCard = ({ source }: { source: DataSource }) => (
    <div className={`p-3 rounded-lg border ${source.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">{source.filename}</p>
          <p className="text-xs text-gray-500">{source.source}目录</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-gray-900">{source.recordsCount}</p>
          <p className="text-xs text-gray-500">记录</p>
        </div>
      </div>
      {source.error && (
        <p className="text-xs text-red-600 mt-1">{source.error}</p>
      )}
      <p className="text-xs text-gray-400 mt-1">
        {source.loadedAt.toLocaleString('zh-CN')}
      </p>
    </div>
  );

  // 拖拽处理函数
  const handleLeftMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsLeftDragging(true);
  }, []);

  const handleAsrMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsAsrDragging(true);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - containerRect.left;
    
    if (isLeftDragging) {
      const newWidth = Math.max(240, Math.min(500, mouseX)); // 限制最小240px，最大500px
      setLeftPanelWidth(newWidth);
    }
    
    if (isAsrDragging) {
      const mouseY = e.clientY - containerRect.top;
      const containerHeight = containerRect.height;
      // 计算从底部开始的高度
      const newHeight = Math.max(150, Math.min(600, containerHeight - mouseY)); // 限制最小150px，最大600px
      setAsrPanelHeight(newHeight);
    }
  }, [isLeftDragging, isAsrDragging]);

  const handleMouseUp = useCallback(() => {
    setIsLeftDragging(false);
    setIsAsrDragging(false);
  }, []);

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (isLeftDragging || isAsrDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isLeftDragging ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isLeftDragging, isAsrDragging, handleMouseMove, handleMouseUp]);

  // 拖拽手柄组件
  const DragHandle = ({ 
    onMouseDown, 
    position 
  }: { 
    onMouseDown: (e: React.MouseEvent) => void;
    position: 'left' | 'right' | 'top';
  }) => {
    const isVertical = position === 'left' || position === 'right';
    const isHorizontal = position === 'top';
    
    return (
      <div
        className={`absolute ${
          isVertical 
            ? `top-0 bottom-0 w-1 ${position === 'left' ? 'right-0' : 'left-0'} cursor-col-resize` 
            : 'left-0 right-0 h-1 top-0 cursor-row-resize'
        } bg-gray-300 hover:bg-blue-500 transition-colors z-10 flex items-center justify-center group`}
        onMouseDown={onMouseDown}
      >
        <div className={`absolute inset-0 ${isVertical ? 'w-4 -mx-1.5' : 'h-4 -my-1.5'}`} /> {/* 扩大点击区域 */}
        <GripVertical 
          className={`h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 ${
            isHorizontal ? 'rotate-90' : ''
          }`} 
        />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-500 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Stethoscope className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">正在加载处方数据</h2>
          <p className="text-gray-600">正在读取所有处方文件...</p>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">暂无病历数据</h2>
          <p className="text-gray-600">请确保在src/data或public/data目录中有以prescriptions开头的JSON文件</p>
          {dataSources.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                尝试加载了 {dataSources.length} 个文件，但都未能成功加载数据
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">中医处方管理系统</h1>
                <p className="text-gray-600">智能辅助诊疗与处方优化平台</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowQRScanner(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-colors shadow-sm"
              >
                <QrCode className="h-4 w-4" />
                <span className="text-sm">扫描二维码</span>
              </button>
              
              <button
                onClick={() => setShowStats(!showStats)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showStats 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="text-sm">统计概览</span>
              </button>
              
              <button
                onClick={() => setShowDataSources(!showDataSources)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showDataSources 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Database className="h-4 w-4" />
                <span className="text-sm">数据源</span>
              </button>
              
              <button
                onClick={() => setShowASR(!showASR)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showASR 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Mic className="h-4 w-4" />
                <span className="text-sm">语音识别</span>
              </button>
              
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                <Settings className="h-4 w-4" />
                <span className="text-sm">设置</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Dashboard */}
      {showStats && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <StatCard
              title="总记录数"
              value={stats.total}
              icon={Users}
              color="bg-blue-500"
              description="病历总数"
            />
            <StatCard
              title="成功处理"
              value={stats.success}
              icon={CheckCircle}
              color="bg-green-500"
              description={`${((stats.success / stats.total) * 100).toFixed(1)}%`}
            />
            <StatCard
              title="处理失败"
              value={stats.failed}
              icon={AlertCircle}
              color="bg-red-500"
              description={`${((stats.failed / stats.total) * 100).toFixed(1)}%`}
            />
            <StatCard
              title="处理中"
              value={stats.processing}
              icon={RefreshCw}
              color="bg-yellow-500"
              description="等待处理"
            />
            <StatCard
              title="已开处方"
              value={stats.withPrescription}
              icon={FileText}
              color="bg-purple-500"
              description={`${((stats.withPrescription / stats.total) * 100).toFixed(1)}%`}
            />
            <StatCard
              title="平均耗时"
              value={`${stats.avgProcessingTime}s`}
              icon={Clock}
              color="bg-indigo-500"
              description="处理时间"
            />
          </div>
        </div>
      )}

      {/* Data Sources Dashboard */}
      {showDataSources && (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">数据源信息</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>成功: {stats.dataSources}</span>
              <span>失败: {stats.totalSources - stats.dataSources}</span>
              <span>总计: {stats.totalSources}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dataSources.map((source, index) => (
              <DataSourceCard key={index} source={source} />
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div 
        ref={containerRef}
        className="flex" 
        style={{ 
          height: (() => {
            let panelCount = 0;
            if (showStats) panelCount++;
            if (showDataSources) panelCount++;
            
            const baseHeight = 80; // header height
            const footerHeight = 40; // footer height
            const panelHeight = 80; // approximate height per panel
            return `calc(100vh - ${baseHeight + footerHeight + (panelCount * panelHeight)}px)`;
          })()
        }}
      >
        {/* Patient List Sidebar */}
        <div 
          className="relative bg-white border-r border-gray-200 flex-shrink-0"
          style={{ width: `${leftPanelWidth}px` }}
        >
          <PatientList
            records={records}
            selectedIndex={selectedIndex}
            onSelectRecord={setSelectedIndex}
          />
          <DragHandle onMouseDown={handleLeftMouseDown} position="left" />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-gray-50 min-w-0 flex flex-col">
          {/* Patient Details */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="max-w-5xl mx-auto">
              <PatientCard
                record={records[selectedIndex]}
                onUpdate={handleUpdateRecord}
              />
            </div>
          </div>
          
          {/* ASR Panel - Bottom Right with adjustable height */}
          {showASR && (
            <div 
              className="relative bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0"
              style={{ height: `${asrPanelHeight}px` }}
            >
              <DragHandle onMouseDown={handleAsrMouseDown} position="top" />
              <div className="h-full overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                  <ASRComponent
                    config={asrConfig}
                    onResult={handleASRResult}
                    onError={handleASRError}
                    onStatusChange={handleASRStatusChange}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Notifications */}
      {globalError && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">错误</p>
                <p className="text-sm text-red-700">{globalError}</p>
              </div>
              <button
                onClick={() => setGlobalError(null)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {globalSuccess && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">成功</p>
                <p className="text-sm text-green-700">{globalSuccess}</p>
              </div>
              <button
                onClick={() => setGlobalSuccess(null)}
                className="ml-2 text-green-500 hover:text-green-700"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScannerComponent
          onScanSuccess={handleQRScanSuccess}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-2">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>当前: 第 {selectedIndex + 1} 条记录</span>
            <span>•</span>
            <span>共 {records.length} 条病历</span>
            <span>•</span>
            <span>来自 {stats.dataSources} 个数据源</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>系统正常</span>
            </div>
            <span>•</span>
            <span>最后更新: {new Date().toLocaleTimeString('zh-CN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 