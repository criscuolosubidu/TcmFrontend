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
    const jsonData = JSON.parse(resultData);
    
    if (jsonData.action === "started") {
      return { text: "", isFinal: false };
    } else if (jsonData.action === "result") {
      const data = JSON.parse(jsonData.data);
      let resultText = "";
      
      data.cn.st.rt.forEach((j: any) => {
        j.ws.forEach((k: any) => {
          k.cw.forEach((l: any) => {
            resultText += l.w;
          });
        });
      });
      
      return { 
        text: resultText, 
        isFinal: data.cn.st.type === 0 
      };
    } else if (jsonData.action === "error") {
      throw new Error(jsonData.error || "识别过程中发生错误");
    }
    
    return { text: "", isFinal: false };
  } catch (error) {
    throw new Error(`解析识别结果失败: ${error}`);
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
