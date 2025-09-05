'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Settings, AlertCircle, Volume2, Info } from 'lucide-react';
import { ASRStatus, ASRConfig, ASRComponentProps } from '@/types/asr';
import { getWebSocketUrl, parseRecognitionResult, checkWebSocketSupport, checkAudioSupport, AudioRecorder } from '@/utils/asr';
import styles from './ASRComponent.module.css';

// 移除对外部RecorderManager的依赖

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
  const recorderRef = useRef<AudioRecorder | null>(null);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  // 状态改变处理
  const changeStatus = useCallback((newStatus: ASRStatus) => {
    setStatus(newStatus);
    onStatusChange?.(newStatus);
  }, [onStatusChange]);

  // 清理定时器
  const clearTimers = useCallback(() => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // 错误处理
  const handleError = useCallback((errorMsg: string) => {
    clearTimers();
    setError(errorMsg);
    onError?.(errorMsg);
    changeStatus('CLOSED');
  }, [onError, changeStatus, clearTimers]);

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
    try {
      console.log('初始化AudioRecorder...');
      const recorder = new AudioRecorder({
        sampleRate: localConfig.sampleRate || 16000,
        frameSize: localConfig.frameSize || 1024,
        onStart: () => {
          changeStatus('OPEN');
        },
        onData: (data: ArrayBuffer) => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(data);
          }
        },
        onStop: () => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send('{"end": true}');
            changeStatus('CLOSING');
          }
        },
        onError: (error: string) => {
          handleError(`录音错误: ${error}`);
        }
      });

      return recorder;
    } catch (err) {
      handleError(`初始化录音器失败: ${err}`);
      return null;
    }
  }, [changeStatus, handleError, localConfig.sampleRate, localConfig.frameSize]);

  // 自动重连的引用，避免循环依赖
  const attemptReconnectRef = useRef<() => void>();

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
      
      // 成功连接时重置重连计数
      reconnectAttempts.current = 0;

      ws.onopen = async () => {
        console.log('WebSocket连接已建立');
        
        // 设置连接超时检测（30秒后如果还没有开始录音则认为连接异常）
        connectionTimeoutRef.current = setTimeout(() => {
          if (status === 'CONNECTING') {
            handleError('连接超时，请检查麦克风权限并重试');
          }
        }, 30000);
        
        // 开始录音
        const recorder = initRecorder();
        if (recorder) {
          recorderRef.current = recorder;
          await recorder.start();
          
          // 清除连接超时检测
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          
          // 启动保活机制 - 每20秒发送一个心跳包
          keepAliveIntervalRef.current = setInterval(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              console.log('发送心跳包保持连接');
              // 发送一个小的静音帧作为心跳
              const silentFrame = new Int8Array(160); // 10ms的静音帧
              wsRef.current.send(silentFrame);
            }
          }, 20000);
        }
      };

      ws.onmessage = (event) => {
        try {
          handleResult(event.data);
        } catch (error) {
          console.error('处理ASR消息失败:', error);
          handleError(`处理识别结果失败: ${error instanceof Error ? error.message : String(error)}`);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket错误:', event);
        const errorMsg = event instanceof ErrorEvent ? event.message : 'WebSocket连接错误';
        
        // 如果是连接错误且还有重连机会，尝试重连
        if (reconnectAttempts.current < maxReconnectAttempts && status !== 'CLOSING') {
          attemptReconnectRef.current?.();
        } else {
          handleError(errorMsg);
        }
        
        if (recorderRef.current) {
          try {
            recorderRef.current.stop();
          } catch (stopError) {
            console.error('停止录音器失败:', stopError);
          }
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket连接已关闭', event.code, event.reason);
        clearTimers();
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

  // 实现自动重连函数
  attemptReconnectRef.current = () => {
    if (reconnectAttempts.current < maxReconnectAttempts) {
      reconnectAttempts.current++;
      setError(`连接中断，正在尝试重连 (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log(`尝试重连 ${reconnectAttempts.current}/${maxReconnectAttempts}`);
        connectWebSocket();
      }, 2000 * reconnectAttempts.current); // 递增延迟重连
    } else {
      handleError('连接失败，已达到最大重连次数。请检查网络连接和配置后手动重试。');
    }
  };

  // 停止录音
  const stopRecording = useCallback(() => {
    clearTimers();
    if (recorderRef.current) {
      recorderRef.current.stop();
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
  }, [clearTimers]);

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
      clearTimers();
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (recorderRef.current) {
        recorderRef.current.stop();
      }
    };
  }, [clearTimers]);

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
                value={localConfig.frameSize || 1024}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value)) {
                    setLocalConfig(prev => ({ ...prev, frameSize: value }));
                  }
                }}
                className={styles.configInput}
                min="256"
                max="16384"
                title="必须是 256-16384 之间的 2 的幂次方 (如: 256, 512, 1024, 2048, 4096, 8192, 16384)"
              />
              <small className="text-xs text-gray-500 mt-1">
                必须是 2 的幂次方 (256, 512, 1024, 2048, 4096, 8192, 16384)
              </small>
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

      {/* 开发者信息提示 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
          <div className="flex items-center space-x-1">
            <Info className="w-3 h-3 flex-shrink-0" />
            <span>开发提示: ScriptProcessorNode已废弃警告来自录音库，不影响功能使用</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ASRComponent;
