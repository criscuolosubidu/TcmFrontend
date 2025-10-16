'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, CheckCircle, AlertCircle, QrCode } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (decodedText: string, decodedResult: any) => void;
  onClose: () => void;
}

export default function QRScannerComponent({ onScanSuccess, onClose }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [cameraList, setCameraList] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = "qr-reader";

  // 获取可用摄像头列表
  useEffect(() => {
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length > 0) {
        setCameraList(devices.map(device => ({
          id: device.id,
          label: device.label || `摄像头 ${device.id}`
        })));
        // 优先选择后置摄像头（通常包含 "back" 或 "rear"）
        const backCamera = devices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('后')
        );
        setSelectedCamera(backCamera?.id || devices[0].id);
      }
    }).catch(err => {
      console.error('获取摄像头列表失败:', err);
      setError('无法获取摄像头列表，请确保已授予摄像头权限');
    });

    return () => {
      // 组件卸载时停止扫描
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // 启动扫描
  const startScanning = async () => {
    if (!selectedCamera) {
      setError('请选择一个摄像头');
      return;
    }

    try {
      setError(null);
      const html5QrCode = new Html5Qrcode(qrCodeRegionId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        selectedCamera,
        {
          fps: 10,    // 每秒扫描帧数
          qrbox: { width: 250, height: 250 }  // 扫描框大小
        },
        (decodedText, decodedResult) => {
          // 扫描成功
          setLastScanned(decodedText);
          onScanSuccess(decodedText, decodedResult);
          
          // 扫描成功后停止扫描（可选）
          // 如果要连续扫描，可以注释掉下面这行
          // stopScanning();
        },
        (errorMessage) => {
          // 扫描失败（通常是未检测到二维码，属于正常情况）
          // console.log('扫描中...', errorMessage);
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error('启动扫描失败:', err);
      setError(`启动扫描失败: ${err.message || '未知错误'}`);
      setIsScanning(false);
    }
  };

  // 停止扫描
  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('停止扫描失败:', err);
      }
    }
  };

  // 切换摄像头
  const handleCameraChange = async (cameraId: string) => {
    if (isScanning) {
      await stopScanning();
    }
    setSelectedCamera(cameraId);
  };

  // 关闭扫描器
  const handleClose = async () => {
    await stopScanning();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600">
          <div className="flex items-center space-x-3">
            <QrCode className="h-6 w-6 text-white" />
            <h2 className="text-xl font-bold text-white">扫描二维码</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* 摄像头选择 */}
          {cameraList.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择摄像头
              </label>
              <select
                value={selectedCamera}
                onChange={(e) => handleCameraChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isScanning}
              >
                {cameraList.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 扫描区域 */}
          <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
            <div id={qrCodeRegionId} className="w-full" />
            
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-white mb-4">准备扫描二维码</p>
                  <button
                    onClick={startScanning}
                    disabled={!selectedCamera}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    开始扫描
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* 扫描结果 */}
          {lastScanned && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 mb-1">扫描成功</p>
                  <p className="text-sm text-green-700 break-all">{lastScanned}</p>
                </div>
              </div>
            </div>
          )}

          {/* 控制按钮 */}
          <div className="mt-6 flex items-center justify-end space-x-3">
            {isScanning && (
              <button
                onClick={stopScanning}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                停止扫描
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              关闭
            </button>
          </div>

          {/* 使用说明 */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>使用说明：</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>点击「开始扫描」按钮启动摄像头</li>
              <li>将二维码对准扫描框，系统会自动识别</li>
              <li>识别成功后会显示二维码内容</li>
              <li>如果有多个摄像头，可以切换选择</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

