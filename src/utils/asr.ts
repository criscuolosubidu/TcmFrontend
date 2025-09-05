// ASR 工具函数
import CryptoJS from 'crypto-js';
import { ASRConfig } from '@/types/asr';

/**
 * MD5 哈希函数
 */
function hex_md5(s: string): string {
  return CryptoJS.MD5(s).toString();
}

/**
 * 获取WebSocket连接URL
 * @param config ASR配置
 * @returns WebSocket URL
 */
export function getWebSocketUrl(config: ASRConfig): string {
  const url = "wss://rtasr.xfyun.cn/v1/ws";
  const appId = config.appId;
  const secretKey = config.apiKey;
  const ts = Math.floor(new Date().getTime() / 1000);
  const signa = hex_md5(appId + ts);
  const signatureSha = CryptoJS.HmacSHA1(signa, secretKey);
  const signature = CryptoJS.enc.Base64.stringify(signatureSha);
  const encodedSignature = encodeURIComponent(signature);
  
  return `${url}?appid=${appId}&ts=${ts}&signa=${encodedSignature}`;
}

/**
 * 解析识别结果
 * @param resultData 原始结果数据
 * @returns 解析后的文本
 */
export function parseRecognitionResult(resultData: string): { text: string; isFinal: boolean } {
  try {
    // 检查输入是否为空或无效
    if (!resultData || typeof resultData !== 'string') {
      console.warn('收到空的或无效的识别结果数据');
      return { text: "", isFinal: false };
    }

    const jsonData = JSON.parse(resultData);
    
    if (jsonData.action === "started") {
      console.log('ASR连接已建立');
      return { text: "", isFinal: false };
    } else if (jsonData.action === "result") {
      // 安全地解析数据
      let data: any;
      try {
        data = typeof jsonData.data === 'string' ? JSON.parse(jsonData.data) : jsonData.data;
      } catch (parseError) {
        console.error('解析result data失败:', parseError);
        return { text: "", isFinal: false };
      }

      // 安全地提取文本
      let resultText = "";
      try {
        if (data?.cn?.st?.rt && Array.isArray(data.cn.st.rt)) {
          data.cn.st.rt.forEach((j: any) => {
            if (j?.ws && Array.isArray(j.ws)) {
              j.ws.forEach((k: any) => {
                if (k?.cw && Array.isArray(k.cw)) {
                  k.cw.forEach((l: any) => {
                    if (l?.w) {
                      resultText += l.w;
                    }
                  });
                }
              });
            }
          });
        }
      } catch (extractError) {
        console.error('提取识别文本失败:', extractError);
        return { text: "", isFinal: false };
      }
      
      return { 
        text: resultText, 
        isFinal: data?.cn?.st?.type === 0 
      };
    } else if (jsonData.action === "error") {
      const errorMsg = jsonData.desc || jsonData.error || "识别过程中发生错误";
      console.error('ASR服务错误:', errorMsg);
      
      // 特殊处理常见错误
      if (errorMsg.includes('37005') || errorMsg.includes('Client idle timeout')) {
        throw new Error('客户端空闲超时，可能是麦克风未正常工作或网络中断。请检查麦克风权限并重试。');
      } else if (errorMsg.includes('10013')) {
        throw new Error('应用配置错误，请检查AppId和ApiKey是否正确。');
      } else if (errorMsg.includes('10014')) {
        throw new Error('应用已过期，请检查讯飞控制台中的应用状态。');
      } else if (errorMsg.includes('10019')) {
        throw new Error('应用调用量超限，请检查讯飞控制台中的用量限制。');
      }
      
      throw new Error(errorMsg);
    }
    
    // 处理其他类型的消息
    console.log('收到未知类型的ASR消息:', jsonData);
    return { text: "", isFinal: false };
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error('JSON解析失败:', resultData);
      throw new Error(`无效的JSON格式: ${error.message}`);
    }
    throw error;
  }
}

/**
 * 检查浏览器是否支持WebSocket
 */
export function checkWebSocketSupport(): boolean {
  return "WebSocket" in window || "MozWebSocket" in window;
}

/**
 * 检查浏览器是否支持录音
 */
export function checkAudioSupport(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
