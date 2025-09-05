'use client';

import React, { useState, useMemo } from 'react';
import { PrescriptionRecord } from '@/types';
import { 
  Calendar, Clock, CheckCircle, AlertCircle, Search, 
  Filter, SortAsc, SortDesc, Users, Eye, Edit,
  Stethoscope, Pill, FileText, RefreshCw
} from 'lucide-react';

interface PatientListProps {
  records: PrescriptionRecord[];
  selectedIndex: number;
  onSelectRecord: (index: number) => void;
}

type SortField = 'time' | 'status' | 'complaint' | 'diagnosis';
type SortOrder = 'asc' | 'desc';
type FilterStatus = 'all' | '成功' | '失败' | '处理中';

export default function PatientList({ records, selectedIndex, onSelectRecord }: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('time');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showFilters, setShowFilters] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '成功':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case '失败':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case '处理中':
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      '成功': 'bg-green-100 text-green-800',
      '失败': 'bg-red-100 text-red-800',
      '处理中': 'bg-yellow-100 text-yellow-800',
    };
    return config[status as keyof typeof config] || 'bg-gray-100 text-gray-800';
  };

  const extractMainComplaint = (record: PrescriptionRecord) => {
    return record.原始记录?.原始病历?.主诉 || record.输入病历.split('\n')[0].replace('主诉：', '') || '未知主诉';
  };

  const extractDiagnosis = (record: PrescriptionRecord) => {
    return record.原始记录?.原始病历?.诊断 || record.原始记录?.证型判断结果?.split('（')[0] || '待诊断';
  };

  const extractSymptoms = (record: PrescriptionRecord) => {
    const symptoms = record.原始记录?.原始病历?.问诊及闻诊 || '';
    return symptoms.length > 50 ? symptoms.substring(0, 50) + '...' : symptoms;
  };

  const filteredAndSortedRecords = useMemo(() => {
    let filtered = records;

    // 状态过滤
    if (filterStatus !== 'all') {
      filtered = filtered.filter(record => record.生成状态 === filterStatus);
    }

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(record => {
        const complaint = extractMainComplaint(record).toLowerCase();
        const diagnosis = extractDiagnosis(record).toLowerCase();
        const symptoms = extractSymptoms(record).toLowerCase();
        const search = searchTerm.toLowerCase();
        
        return complaint.includes(search) || 
               diagnosis.includes(search) || 
               symptoms.includes(search) ||
               record.处方结果.toLowerCase().includes(search);
      });
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'time':
          aValue = a.处理时间;
          bValue = b.处理时间;
          break;
        case 'status':
          aValue = a.生成状态;
          bValue = b.生成状态;
          break;
        case 'complaint':
          aValue = extractMainComplaint(a);
          bValue = extractMainComplaint(b);
          break;
        case 'diagnosis':
          aValue = extractDiagnosis(a);
          bValue = extractDiagnosis(b);
          break;
        default:
          aValue = a.处理时间;
          bValue = b.处理时间;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return filtered;
  }, [records, searchTerm, sortField, sortOrder, filterStatus]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getOriginalIndex = (filteredIndex: number) => {
    const record = filteredAndSortedRecords[filteredIndex];
    return records.findIndex(r => r === record);
  };

  const getCurrentSelectedIndex = () => {
    const selectedRecord = records[selectedIndex];
    return filteredAndSortedRecords.findIndex(r => r === selectedRecord);
  };

  return (
    <div className="w-full bg-white h-full flex flex-col animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center">
            <Users className="mr-2 h-5 w-5 text-blue-600" />
            患者列表
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-md transition-colors ${
              showFilters ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
            }`}
            title="过滤选项"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索患者、症状、诊断..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
          <span>共 {filteredAndSortedRecords.length} 条记录</span>
          <span>原始: {records.length}</span>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="space-y-3">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">状态筛选</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">全部状态</option>
                <option value="成功">成功</option>
                <option value="失败">失败</option>
                <option value="处理中">处理中</option>
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">排序方式</label>
              <div className="flex space-x-1">
                <button
                  onClick={() => handleSort('time')}
                  className={`flex items-center px-2 py-1 rounded text-xs ${
                    sortField === 'time' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Clock className="h-3 w-3 mr-1" />
                  时间
                  {sortField === 'time' && (
                    sortOrder === 'asc' ? <SortAsc className="h-3 w-3 ml-1" /> : <SortDesc className="h-3 w-3 ml-1" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('complaint')}
                  className={`flex items-center px-2 py-1 rounded text-xs ${
                    sortField === 'complaint' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <FileText className="h-3 w-3 mr-1" />
                  主诉
                  {sortField === 'complaint' && (
                    sortOrder === 'asc' ? <SortAsc className="h-3 w-3 ml-1" /> : <SortDesc className="h-3 w-3 ml-1" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('status')}
                  className={`flex items-center px-2 py-1 rounded text-xs ${
                    sortField === 'status' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  状态
                  {sortField === 'status' && (
                    sortOrder === 'asc' ? <SortAsc className="h-3 w-3 ml-1" /> : <SortDesc className="h-3 w-3 ml-1" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
             {/* Records List */}
       <div className="flex-1 overflow-y-auto custom-scrollbar">
         {filteredAndSortedRecords.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">没有找到匹配的记录</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-2 text-blue-500 hover:text-blue-700 text-sm"
              >
                清除搜索条件
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAndSortedRecords.map((record, index) => {
              const originalIndex = getOriginalIndex(index);
              const isSelected = getCurrentSelectedIndex() === index;
              
              return (
                                 <div
                   key={originalIndex}
                   onClick={() => onSelectRecord(originalIndex)}
                   className={`p-4 cursor-pointer transition-all hover:bg-gray-50 card-hover ${
                     isSelected 
                       ? 'bg-blue-50 border-r-4 border-blue-500 shadow-sm' 
                       : 'border-r-4 border-transparent'
                   }`}
                 >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate flex-1 text-sm">
                      {extractMainComplaint(record)}
                    </h3>
                    <div className="ml-2 flex-shrink-0">
                      {getStatusIcon(record.生成状态)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-gray-600">
                      <Stethoscope className="h-3 w-3 mr-1" />
                      <span className="truncate">{extractDiagnosis(record)}</span>
                    </div>
                    
                    {extractSymptoms(record) && (
                      <div className="flex items-start text-xs text-gray-500">
                        <Eye className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{extractSymptoms(record)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {record.处理时间.toFixed(1)}s
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(record.生成状态)}`}>
                        {record.生成状态}
                      </span>
                      
                      {record.处方结果 && (
                        <div className="flex items-center text-xs text-green-600">
                          <Pill className="h-3 w-3 mr-1" />
                          <span>已处方</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>筛选结果: {filteredAndSortedRecords.length}</span>
          <span>当前: #{getCurrentSelectedIndex() + 1}</span>
        </div>
      </div>
    </div>
  );
} 