export interface OriginalRecord {
  原始病历: {
    主诉: string;
    病史: string;
    体格检查: string;
    辅助检查: string;
    问诊及闻诊: string;
    舌象: string;
    脉象: string;
    诊断: string;
    处置意见: string;
  };
  格式化病历: string;
  LLM完整响应: string;
  证型判断结果: string;
  判断状态: string;
  处理时间: number;
}

export interface PrescriptionRecord {
  原始记录: OriginalRecord;
  输入病历: string;
  输入诊断: string;
  LLM完整响应: string;
  处方结果: string;
  生成状态: string;
  处理时间: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface EditableField {
  key: string;
  label: string;
  value: string;
  type: 'text' | 'textarea' | 'select';
  options?: string[];
} 