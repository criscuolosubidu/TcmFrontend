'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { PrescriptionRecord } from '@/types';
import { 
  Edit, Save, X, FileText, User, Stethoscope, Pill, 
  Clock, CheckCircle, AlertCircle, Copy, Search, 
  Activity, BookOpen, Heart
} from 'lucide-react';
import styles from './PatientCard.module.css';

interface PatientCardProps {
  record: PrescriptionRecord;
  onUpdate: (updatedRecord: PrescriptionRecord) => void;
}

export default function PatientCard({ record, onUpdate }: PatientCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecord, setEditedRecord] = useState(record);
  const [activeTab, setActiveTab] = useState('basic');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setEditedRecord(record);
  }, [record]);

  const handleSave = () => {
    onUpdate(editedRecord);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedRecord(record);
    setIsEditing(false);
  };

  const handleFieldChange = (path: string, value: string) => {
    const pathArray = path.split('.');
    const updatedRecord = { ...editedRecord };
    let current: any = updatedRecord;
    
    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    current[pathArray[pathArray.length - 1]] = value;
    
    setEditedRecord(updatedRecord);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // 预处理函数，去掉XML标签
  const preprocessContent = (content: string): string => {
    if (!content) return '';
    
    // 保留 <think> 标签中的内容，仅去除标签本身
    let processed = content.replace(/<\/?think>/gi, '');
    
    // 去掉<answer>和</answer>标签，但保留内容
    processed = processed.replace(/<\/?answer>/gi, '');
    
    // 去掉其他常见的XML标签（只去标签，保留内容）
    processed = processed.replace(/<\/?(?:response|output|result)>/gi, '');
    
    return processed.trim();
  };

  // （处方专用解析 / 渲染 / 导出等逻辑已完全移除）

  // （已移除处方专用解析及渲染逻辑，统一使用 Markdown 渲染）

  // 判断字段是否应该使用markdown渲染
  const shouldUseMarkdown = (path: string): boolean => {
    const markdownFields = [
      'LLM完整响应',
      '原始记录.证型判断结果',
      '原始记录.LLM完整响应',
      '输入诊断',
      '原始记录.原始病历.处置意见',
      '原始记录.原始病历.主诉',
      '原始记录.原始病历.病史',
      '原始记录.原始病历.体格检查',
      '原始记录.原始病历.辅助检查',
      '原始记录.原始病历.问诊及闻诊',
      '原始记录.原始病历.舌象',
      '原始记录.原始病历.脉象',
      '原始记录.原始病历.诊断',
      '处方结果' // 新增：将处方结果字段改为使用 Markdown 渲染
    ];
    return markdownFields.includes(path);
  };

  // 已移除 shouldUsePrescriptionRenderer

  // 自定义markdown渲染组件
  const MarkdownRenderer = ({ content }: { content: string }) => {
    const processedContent = preprocessContent(content);
    
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            const inline = !match;
            return !inline && match ? (
              <pre className="bg-gray-100 rounded-md p-3 overflow-auto border-l-4 border-blue-500 my-2">
                <code className={`${className} !bg-transparent text-sm`} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className={`${className} bg-gray-100 px-1 py-0.5 rounded text-sm font-mono`} {...props}>
                {children}
              </code>
            );
          },
          p: ({ children }) => (
            <p className="mb-1 leading-relaxed last:mb-0">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-sm leading-relaxed">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-800">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-700">{children}</em>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 my-2">
              {children}
            </blockquote>
          ),
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mb-2 text-gray-800">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold mb-2 text-gray-800">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-medium mb-1 text-gray-800">{children}</h3>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    );
  };

  const renderEditableField = (label: string, path: string, multiline = false, height = 'h-24') => {
    const pathArray = path.split('.');
    let value: any = editedRecord;
    
    for (const key of pathArray) {
      value = value[key as keyof typeof value];
    }
    
    const stringValue = value as string;

    const fieldClass = `w-full p-3 border rounded-lg transition-all duration-200 ${
      isEditing 
        ? 'border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200' 
        : 'border-gray-200 bg-gray-50'
    }`;

    if (isEditing) {
      return multiline ? (
        <textarea
          value={stringValue || ''}
          onChange={(e) => handleFieldChange(path, e.target.value)}
          className={`${fieldClass} resize-none ${height}`}
          placeholder={`请输入${label}`}
        />
      ) : (
        <input
          type="text"
          value={stringValue || ''}
          onChange={(e) => handleFieldChange(path, e.target.value)}
          className={fieldClass}
          placeholder={`请输入${label}`}
        />
      );
    }

    return (
      <div className={`${fieldClass} relative group`}>
        <div className={multiline ? 'whitespace-pre-wrap' : 'truncate'}>
          {stringValue ? (
            shouldUseMarkdown(path) ? (
              <div className={styles.markdownContent}>
                <MarkdownRenderer content={stringValue} />
              </div>
            ) : (
              <div className={multiline ? 'whitespace-pre-wrap' : 'truncate'}>
                {stringValue}
              </div>
            )
          ) : (
            <span className="text-gray-400">暂无数据</span>
          )}
        </div>
        {stringValue && (
          <button
            onClick={() => copyToClipboard(stringValue)}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
            title="复制"
          >
            <Copy className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  };

  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      '成功': { icon: CheckCircle, color: 'bg-green-100 text-green-800', iconColor: 'text-green-500' },
      '失败': { icon: AlertCircle, color: 'bg-red-100 text-red-800', iconColor: 'text-red-500' },
      '处理中': { icon: Clock, color: 'bg-yellow-100 text-yellow-800', iconColor: 'text-yellow-500' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['处理中'];
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className={`h-3 w-3 mr-1 ${config.iconColor}`} />
        {status}
      </div>
    );
  };

  const tabs = [
    { id: 'basic', label: '基本信息', icon: FileText },
    { id: 'tcm', label: '中医诊断', icon: Stethoscope },
    { id: 'prescription', label: '处方结果', icon: Pill },
    { id: 'analysis', label: '分析结果', icon: Activity },
  ];

  const filteredContent = (content: string) => {
    if (!searchTerm) return content;
    return content.replace(
      new RegExp(`(${searchTerm})`, 'gi'),
      '<mark class="bg-yellow-200">$1</mark>'
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden card-hover animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <User className="mr-3 h-6 w-6 text-blue-600" />
              患者病历详情
            </h2>
            <p className="text-gray-600 mt-1">
              主诉: {record.原始记录?.原始病历?.主诉 || '未知'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {renderStatusBadge(record.生成状态)}
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              {record.处理时间.toFixed(1)}s
            </div>
          </div>
        </div>

        {/* Search and Edit Controls */}
        <div className="flex justify-between items-center mt-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索病历内容..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex space-x-2">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="mr-2 h-4 w-4" />
                编辑
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Save className="mr-2 h-4 w-4" />
                  保存修改
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="mr-2 h-4 w-4" />
                  取消
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-gray-50">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Heart className="inline h-4 w-4 mr-1" />
                    主诉
                  </label>
                  {renderEditableField('主诉', '原始记录.原始病历.主诉')}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <BookOpen className="inline h-4 w-4 mr-1" />
                    病史
                  </label>
                  {renderEditableField('病史', '原始记录.原始病历.病史', true, 'h-32')}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Activity className="inline h-4 w-4 mr-1" />
                    体格检查
                  </label>
                  {renderEditableField('体格检查', '原始记录.原始病历.体格检查', true, 'h-24')}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">辅助检查</label>
                  {renderEditableField('辅助检查', '原始记录.原始病历.辅助检查', true, 'h-24')}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">问诊及闻诊</label>
                  {renderEditableField('问诊及闻诊', '原始记录.原始病历.问诊及闻诊', true, 'h-32')}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tcm' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">舌象</label>
                  {renderEditableField('舌象', '原始记录.原始病历.舌象', true, 'h-20')}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">脉象</label>
                  {renderEditableField('脉象', '原始记录.原始病历.脉象')}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">西医诊断</label>
                  {renderEditableField('诊断', '原始记录.原始病历.诊断', true, 'h-20')}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">中医证型判断</label>
                  {renderEditableField('证型判断', '原始记录.证型判断结果', true, 'h-32')}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">判断状态</h4>
                  <p className="text-blue-800">{record.原始记录.判断状态}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'prescription' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Pill className="inline h-4 w-4 mr-1" />
                处方结果
              </label>
              {renderEditableField('处方结果', '处方结果', true, 'h-64')}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">原始处置意见</label>
              {renderEditableField('处置意见', '原始记录.原始病历.处置意见', true, 'h-32')}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            {/* 证型与处方两段分析 */}
            <div className="space-y-4">
              {/* 证型分析 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">证型分析过程</label>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className={styles.markdownContent}>
                    <MarkdownRenderer content={record.原始记录?.LLM完整响应 || '暂无分析数据'} />
                  </div>
                </div>
              </div>
              {/* 处方分析 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">处方分析过程</label>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <div className={styles.markdownContent}>
                    <MarkdownRenderer content={record.LLM完整响应 || '暂无分析数据'} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">处理统计</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>处理时间:</span>
                    <span className="font-medium">{record.处理时间.toFixed(2)}秒</span>
                  </div>
                  <div className="flex justify-between">
                    <span>生成状态:</span>
                    <span className="font-medium">{record.生成状态}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">数据完整性</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>病历完整性:</span>
                    <span className="font-medium">
                      {record.输入病历 ? '完整' : '不完整'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>诊断完整性:</span>
                    <span className="font-medium">
                      {record.输入诊断 ? '完整' : '不完整'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>处方完整性:</span>
                    <span className="font-medium">
                      {record.处方结果 ? '完整' : '不完整'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 