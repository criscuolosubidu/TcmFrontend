'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Settings, AlertCircle, Volume2 } from 'lucide-react';
import { ASRStatus, ASRConfig, ASRComponentProps } from '@/types/asr';
import { getWebSocketUrl, parseRecognitionResult, checkWebSocketSupport, checkAudioSupport } from '@/utils/asr';
import styles from './ASRComponent.module.css';

// 声明全局变量以支持RecorderManager
declare global {
  interface Window {
    RecorderManager?: any;
  }
}

const ASRComponent: React.FC<ASRComponentProps> = ({
  config,
  onResult,
  onError,
  onStatusChange,
  className = ''
}) => {
  const [status, setStatus] = useState<ASRStatus>('UNDEFINED');
  const [resultText, setResultText] = useState('');
  const [tempText, setTempText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [localConfig, setLocalConfig] = useState<ASRConfig>(config);

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<any>(null);

  // 状态改变处理
  const changeStatus = useCallback((newStatus: ASRStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  // 错误处理
  const handleError = useCallback((errorMsg: string) => {
    setError(errorMsg);
    onError?.(errorMsg);
    changeStatus('CLOSED');
  }, [onError, changeStatus]);

  // 结果处理
  const handleResult = useCallback((data: string) => {
    try {
      const { text, isFinal } = parseRecognitionResult(data);
      
      if (isFinal) {
        // 最终结果
        const newResultText = resultText + text;
        setResultText(newResultText);
        setTempText('');
        onResult?.(newResultText);
      } else {
        // 临时结果
        setTempText(text);
      }
    } catch (err) {
      handleError(`解析结果失败: ${err}`);
    }
  }, [resultText, onResult, handleError]);

  // 初始化录音器
  const initRecorder = useCallback(() => {
    if (!window.RecorderManager) {
      handleError('RecorderManager 未加载，请确保已引入相关脚本文件');
      return null;
    }

    try {
      const recorder = new window.RecorderManager();
      
      recorder.onStart = () => {
        changeStatus('OPEN');
      };

      recorder.onFrameRecorded = ({ isLastFrame, frameBuffer }: any) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(new Int8Array(frameBuffer));
          if (isLastFrame) {
            wsRef.current.send('{"end": true}');
            changeStatus('CLOSING');
          }
        }
      };

      recorder.onStop = () => {
        // 录音停止处理
      };

      return recorder;
    } catch (err) {
      handleError(`初始化录音器失败: ${err}`);
      return null;
    }
  }, [changeStatus, handleError]);

  // 连接WebSocket
  const connectWebSocket = useCallback(() => {
    if (!checkWebSocketSupport()) {
      handleError('浏览器不支持WebSocket');
      return;
    }

    if (!checkAudioSupport()) {
      handleError('浏览器不支持录音功能');
      return;
    }

    if (!localConfig.appId || !localConfig.apiKey) {
      handleError('请配置AppId和ApiKey');
      return;
    }

    try {
      const websocketUrl = getWebSocketUrl(localConfig);
      const ws = new WebSocket(websocketUrl);
      
      changeStatus('CONNECTING');
      setError(null);

      ws.onopen = () => {
        // 开始录音
        const recorder = initRecorder();
        if (recorder) {
          recorderRef.current = recorder;
          recorder.start({
            sampleRate: localConfig.sampleRate || 16000,
            frameSize: localConfig.frameSize || 1280,
          });
        }
      };

      ws.onmessage = (event) => {
        handleResult(event.data);
      };

      ws.onerror = (event) => {
        console.error('WebSocket错误:', event);
        handleError('WebSocket连接错误');
        if (recorderRef.current) {
          recorderRef.current.stop();
        }
      };

      ws.onclose = () => {
        if (recorderRef.current) {
          recorderRef.current.stop();
        }
        changeStatus('CLOSED');
      };

      wsRef.current = ws;
    } catch (err) {
      handleError(`连接失败: ${err}`);
    }
  }, [localConfig, changeStatus, handleError, initRecorder, handleResult]);

  // 停止录音
  const stopRecording = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.stop();
    }
  }, []);

  // 按钮点击处理
  const handleButtonClick = useCallback(() => {
    if (status === 'UNDEFINED' || status === 'CLOSED') {
      connectWebSocket();
    } else if (status === 'CONNECTING' || status === 'OPEN') {
      stopRecording();
    }
  }, [status, connectWebSocket, stopRecording]);

  // 清空结果
  const clearResult = useCallback(() => {
    setResultText('');
    setTempText('');
    setError(null);
  }, []);

  // 获取状态文本
  const getStatusText = useCallback((currentStatus: ASRStatus) => {
    switch (currentStatus) {
      case 'CONNECTING': return '建立连接中';
      case 'OPEN': return '录音中';
      case 'CLOSING': return '关闭连接中';
      case 'CLOSED': return '已停止';
      default: return '准备就绪';
    }
  }, []);

  // 获取按钮文本
  const getButtonText = useCallback((currentStatus: ASRStatus) => {
    switch (currentStatus) {
      case 'CONNECTING': return '连接中...';
      case 'OPEN': return '停止录音';
      case 'CLOSING': return '停止中...';
      default: return '开始录音';
    }
  }, []);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (recorderRef.current) {
        recorderRef.current.stop();
      }
    };
  }, []);

  const displayText = resultText + tempText;

  return (
    <div className={`${styles.asrContainer} ${className}`}>
      {/* 头部 */}
      <div className={styles.asrHeader}>
        <h3 className={styles.asrTitle}>实时语音识别</h3>
        <div className="flex items-center space-x-2">
          <span className={`${styles.asrStatus} ${styles[`status${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}`]}`}>
            {getStatusText(status)}
          </span>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
            title="设置"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 配置面板 */}
      {showConfig && (
        <div className={styles.configSection}>
          <h4 className={styles.configTitle}>配置信息</h4>
          <div className={styles.configGrid}>
            <div className={styles.configItem}>
              <label className={styles.configLabel}>App ID</label>
              <input
                type="text"
                value={localConfig.appId}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, appId: e.target.value }))}
                className={styles.configInput}
                placeholder="请输入App ID"
              />
            </div>
            <div className={styles.configItem}>
              <label className={styles.configLabel}>API Key</label>
              <input
                type="password"
                value={localConfig.apiKey}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                className={styles.configInput}
                placeholder="请输入API Key"
              />
            </div>
            <div className={styles.configItem}>
              <label className={styles.configLabel}>采样率</label>
              <input
                type="number"
                value={localConfig.sampleRate || 16000}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, sampleRate: parseInt(e.target.value) }))}
                className={styles.configInput}
              />
            </div>
            <div className={styles.configItem}>
              <label className={styles.configLabel}>帧大小</label>
              <input
                type="number"
                value={localConfig.frameSize || 1280}
                onChange={(e) => setLocalConfig(prev => ({ ...prev, frameSize: parseInt(e.target.value) }))}
                className={styles.configInput}
              />
            </div>
          </div>
        </div>
      )}

      {/* 控制区域 */}
      <div className={styles.controlSection}>
        <button
          onClick={handleButtonClick}
          className={`${styles.recordButton} ${styles[`recordButton${status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}`]}`}
          disabled={status === 'CONNECTING' || status === 'CLOSING'}
        >
          {status === 'OPEN' ? (
            <>
              <MicOff className={styles.recordIcon} />
              <div className={styles.recordingIndicator} />
            </>
          ) : (
            <Mic className={styles.recordIcon} />
          )}
        </button>
        
        <span className={styles.buttonText}>
          {getButtonText(status)}
        </span>

        {/* 录音中的波形指示器 */}
        {status === 'OPEN' && (
          <div className={styles.waveform}>
            {[...Array(7)].map((_, i) => (
              <div key={i} className={styles.waveBar} />
            ))}
          </div>
        )}
      </div>

      {/* 结果显示区域 */}
      <div className={styles.resultSection}>
        <div className="flex items-center justify-between mb-2">
          <label className={styles.resultLabel}>识别结果</label>
          <div className="flex items-center space-x-2">
            {displayText && (
              <button
                onClick={() => navigator.clipboard?.writeText(displayText)}
                className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                title="复制到剪贴板"
              >
                复制
              </button>
            )}
            <button
              onClick={clearResult}
              className="text-xs text-gray-600 hover:text-gray-800 transition-colors"
              title="清空结果"
            >
              清空
            </button>
          </div>
        </div>
        
        <textarea
          value={displayText}
          readOnly
          className={`${styles.resultText} ${!displayText ? styles.resultEmpty : ''}`}
          placeholder="开始录音后，识别结果将显示在这里..."
        />
      </div>

      {/* 错误信息 */}
      {error && (
        <div className={styles.errorMessage}>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ASRComponent;
