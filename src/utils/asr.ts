import {ASRConfig} from '@/types/asr';
import CryptoJS from 'crypto-js';

// 基于科大讯飞官方示例的MD5实现
function hex_md5(s: string): string {
    function safe_add(x: number, y: number): number {
        const lsw = (x & 0xFFFF) + (y & 0xFFFF);
        const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }

    function bit_rol(num: number, cnt: number): number {
        return (num << cnt) | (num >>> (32 - cnt));
    }

    function md5_cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
        return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
    }

    function md5_ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
        return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }

    function md5_gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
        return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }

    function md5_hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
        return md5_cmn(b ^ c ^ d, a, b, x, s, t);
    }

    function md5_ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
        return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    function str2binl(str: string): number[] {
        const bin: number[] = [];
        const chrsz = 8;
        const mask = (1 << chrsz) - 1;
        for (let i = 0; i < str.length * chrsz; i += chrsz) {
            bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (i % 32);
        }
        return bin;
    }

    function binl2hex(binarray: number[]): string {
        const hex_tab = "0123456789abcdef";
        let str = "";
        for (let i = 0; i < binarray.length * 4; i++) {
            str += hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xF) +
                hex_tab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xF);
        }
        return str;
    }

    function core_md5(x: number[], len: number): number[] {
        x[len >> 5] |= 0x80 << ((len) % 32);
        x[(((len + 64) >>> 9) << 4) + 14] = len;

        let a = 1732584193;
        let b = -271733879;
        let c = -1732584194;
        let d = 271733878;

        for (let i = 0; i < x.length; i += 16) {
            const olda = a, oldb = b, oldc = c, oldd = d;

            a = md5_ff(a, b, c, d, x[i + 0], 7, -680876936);
            d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
            c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
            b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
            a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
            d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
            c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
            b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
            a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
            d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
            c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
            b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
            a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
            d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
            c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
            b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);

            a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
            d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
            c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
            b = md5_gg(b, c, d, a, x[i + 0], 20, -373897302);
            a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
            d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
            c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
            b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
            a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
            d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
            c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
            b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
            a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
            d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
            c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
            b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);

            a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
            d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
            c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
            b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
            a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
            d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
            c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
            b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
            a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
            d = md5_hh(d, a, b, c, x[i + 0], 11, -358537222);
            c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
            b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
            a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
            d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
            c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
            b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);

            a = md5_ii(a, b, c, d, x[i + 0], 6, -198630844);
            d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
            c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
            b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
            a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
            d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
            c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
            b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
            a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
            d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
            c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
            b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
            a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
            d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
            c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
            b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);

            a = safe_add(a, olda);
            b = safe_add(b, oldb);
            c = safe_add(c, oldc);
            d = safe_add(d, oldd);
        }
        return [a, b, c, d];
    }

    const chrsz = 8;
    return binl2hex(core_md5(str2binl(s), s.length * chrsz));
}

// 基于科大讯飞官方示例的HMAC-SHA1实现
class CryptoJSWordArray {
    words: number[];
    sigBytes: number;

    constructor(words: number[] = [], sigBytes?: number) {
        this.words = words;
        this.sigBytes = sigBytes !== undefined ? sigBytes : words.length * 4;
    }

    concat(wordArray: CryptoJSWordArray): CryptoJSWordArray {
        const thisWords = this.words;
        const thatWords = wordArray.words;
        const thisSigBytes = this.sigBytes;
        const thatSigBytes = wordArray.sigBytes;

        this.clamp();

        if (thisSigBytes % 4) {
            for (let i = 0; i < thatSigBytes; i++) {
                const thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
            }
        } else if (thatWords.length > 0xffff) {
            for (let i = 0; i < thatSigBytes; i += 4) {
                thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
            }
        } else {
            thisWords.push(...thatWords);
        }
        this.sigBytes += thatSigBytes;

        return this;
    }

    clamp(): void {
        const words = this.words;
        const sigBytes = this.sigBytes;

        words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
        words.length = Math.ceil(sigBytes / 4);
    }

    clone(): CryptoJSWordArray {
        return new CryptoJSWordArray([...this.words], this.sigBytes);
    }
}

function parseUtf8(utf8Str: string): CryptoJSWordArray {
    return parseLatin1(unescape(encodeURIComponent(utf8Str)));
}

function parseLatin1(latin1Str: string): CryptoJSWordArray {
    const words: number[] = [];
    for (let i = 0; i < latin1Str.length; i++) {
        words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
    }
    return new CryptoJSWordArray(words, latin1Str.length);
}

function stringifyBase64(wordArray: CryptoJSWordArray): string {
    const words = wordArray.words;
    const sigBytes = wordArray.sigBytes;
    const map = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

    wordArray.clamp();

    const base64Chars: string[] = [];
    for (let i = 0; i < sigBytes; i += 3) {
        const byte1 = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
        const byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
        const byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;

        const triplet = (byte1 << 16) | (byte2 << 8) | byte3;

        for (let j = 0; (j < 4) && (i + j * 0.75 < sigBytes); j++) {
            base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
        }
    }

    const paddingChar = map.charAt(64);
    if (paddingChar) {
        while (base64Chars.length % 4) {
            base64Chars.push(paddingChar);
        }
    }

    return base64Chars.join('');
}

// SHA1 实现
function sha1(message: CryptoJSWordArray): CryptoJSWordArray {
    const H = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];

    const words = message.words.slice();
    const sigBytes = message.sigBytes;

    // 添加填充
    words[sigBytes >>> 2] |= 0x80 << (24 - (sigBytes % 4) * 8);
    words[(((sigBytes + 64) >>> 9) << 4) + 14] = Math.floor(sigBytes * 8 / 0x100000000);
    words[(((sigBytes + 64) >>> 9) << 4) + 15] = sigBytes * 8;

    const W = new Array(80);

    for (let i = 0; i < words.length; i += 16) {
        let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4];

        for (let j = 0; j < 80; j++) {
            if (j < 16) {
                W[j] = words[i + j] | 0;
            } else {
                W[j] = rotateLeft(W[j - 3] ^ W[j - 8] ^ W[j - 14] ^ W[j - 16], 1);
            }

            const t = (rotateLeft(a, 5) + f(j, b, c, d) + e + W[j] + K(j)) | 0;
            e = d;
            d = c;
            c = rotateLeft(b, 30);
            b = a;
            a = t;
        }

        H[0] = (H[0] + a) | 0;
        H[1] = (H[1] + b) | 0;
        H[2] = (H[2] + c) | 0;
        H[3] = (H[3] + d) | 0;
        H[4] = (H[4] + e) | 0;
    }

    return new CryptoJSWordArray(H, 20);
}

function rotateLeft(n: number, s: number): number {
    return (n << s) | (n >>> (32 - s));
}

function f(t: number, b: number, c: number, d: number): number {
    if (t < 20) return (b & c) | ((~b) & d);
    if (t < 40) return b ^ c ^ d;
    if (t < 60) return (b & c) | (b & d) | (c & d);
    return b ^ c ^ d;
}

function K(t: number): number {
    if (t < 20) return 0x5A827999;
    if (t < 40) return 0x6ED9EBA1;
    if (t < 60) return 0x8F1BBCDC;
    return 0xCA62C1D6;
}

// HMAC-SHA1 实现
function hmacSha1(message: string, key: string): CryptoJSWordArray {
    const keyWordArray = parseUtf8(key);
    const messageWordArray = parseUtf8(message);

    let keyWords = keyWordArray.words;
    let keySize = keyWordArray.sigBytes;

    if (keySize > 64) {
        keyWords = sha1(keyWordArray).words;
        keySize = 20;
    }

    const iKey = new CryptoJSWordArray();
    const oKey = new CryptoJSWordArray();

    for (let i = 0; i < 16; i++) {
        const keyWord = keyWords[i] || 0;
        iKey.words[i] = keyWord ^ 0x36363636;
        oKey.words[i] = keyWord ^ 0x5C5C5C5C;
    }
    iKey.sigBytes = oKey.sigBytes = 64;

    const innerHash = sha1(iKey.concat(messageWordArray));
    return sha1(oKey.concat(innerHash));
}

/**
 * 获取WebSocket连接URL（基于科大讯飞官方示例）
 * @param config ASR配置
 * @returns WebSocket URL
 */
// export function getWebSocketUrl(config: ASRConfig): string {
//   const baseUrl = 'wss://rtasr.xfyun.cn/v1/ws';
//
//   // 生成时间戳
//   // const ts = Math.floor(Date.now() / 1000).toString();
//     const ts = '1757094020';
//   // 按照科大讯飞官方示例: 先MD5，再HMAC-SHA1，最后Base64
//   const signa = hex_md5(config.appId + ts);
//   const signatureSha = hmacSha1(signa, config.apiKey);
//   const signature = stringifyBase64(signatureSha);
//   const encodedSignature = encodeURIComponent(signature);
//
//   console.log(baseUrl, config.appId, config.apiKey, ts);
//   console.log(signa, signatureSha, signature);
//   console.log(encodedSignature);
//
//   console.log('ASR签名调试信息（基于官方示例）:');
//   console.log('AppId:', config.appId);
//   console.log('ApiKey:', config.apiKey.substring(0, 8) + '...');
//   console.log('时间戳:', ts);
//   console.log('MD5结果:', signa);
//   console.log('签名(Base64):', signature);
//   console.log('完整URL:', `${baseUrl}?appid=${config.appId}&ts=${ts}&signa=${encodedSignature}`);
//
//   // 构建完整URL
//   return `${baseUrl}?appid=${config.appId}&ts=${ts}&signa=${encodedSignature}`;
// }
export function getWebSocketUrl(config: ASRConfig): string {
    const baseUrl = 'wss://rtasr.xfyun.cn/v1/ws';

    // 生成时间戳 (Using a fixed one for debugging as in your original code)
    // For production, use: const ts = Math.floor(Date.now() / 1000).toString();
    const ts = Math.floor(Date.now() / 1000).toString();

    // 1. MD5 hash of (appId + ts)
    const signa = CryptoJS.MD5(config.appId + ts).toString();

    // 2. HMAC-SHA1 hash of the MD5 result, using apiKey as the key
    const signatureSha = CryptoJS.HmacSHA1(signa, config.apiKey);

    // 3. Base64 encode the HMAC-SHA1 result
    const signature = CryptoJS.enc.Base64.stringify(signatureSha);

    // 4. URL-encode the final signature
    const encodedSignature = encodeURIComponent(signature);

    console.log(baseUrl, config.appId, config.apiKey, ts);
    console.log(signa, signatureSha, signature);
    console.log(encodedSignature);

    // (Optional) For debugging, you can log the intermediate values
    console.log('Using crypto-js library for signing:');
    console.log('AppId:', config.appId);
    console.log('Timestamp:', ts);
    console.log('MD5 Result (signa):', signa);
    console.log('Signature (Base64):', signature);
    console.log('Encoded Signature:', encodedSignature);

    // 构建完整URL
    return `${baseUrl}?appid=${config.appId}&ts=${ts}&signa=${encodedSignature}`;
}

/**
 * 解析识别结果（基于科大讯飞官方示例）
 * @param data 原始结果数据
 * @returns 解析后的文本
 */
export const parseRecognitionResult = (data: string): { text: string; isFinal: boolean } => {
    try {
        const jsonData = JSON.parse(data);

        // 处理握手成功
        if (jsonData.action === "started") {
            console.log("握手成功");
            return { text: '', isFinal: false };
        }

        // 处理识别结果
        if (jsonData.action === "result") {
            const resultData = JSON.parse(jsonData.data);
            console.log('原始识别数据:', resultData);

            // 拼接识别文本
            let resultText = '';
            if (resultData.cn && resultData.cn.st && resultData.cn.st.rt) {
                resultData.cn.st.rt.forEach((rtItem: any) => {
                    if (rtItem.ws) {
                        rtItem.ws.forEach((wsItem: any) => {
                            if (wsItem.cw) {
                                wsItem.cw.forEach((cwItem: any) => {
                                    if (cwItem.w) {
                                        resultText += cwItem.w;
                                    }
                                });
                            }
                        });
                    }
                });
            }

            // 判断是否为最终结果
            // type === 0 表示最终识别结果（句子结束）
            // type === 1 表示中间识别结果（实时反馈）
            const isFinal = resultData.cn?.st?.type == 0;

            console.log('解析结果:', {
                text: resultText,
                isFinal,
                type: resultData.cn?.st?.type,
                seg_id: resultData.seg_id  // 句子序号，用于调试
            });

            return {
                text: resultText,
                isFinal: isFinal
            };
        }

        // 处理错误
        if (jsonData.action === "error") {
            console.error("识别服务错误:", jsonData);
            throw new Error(jsonData.desc || "识别服务错误");
        }

        // 其他情况返回空结果
        return { text: '', isFinal: false };

    } catch (error) {
        console.error('解析识别结果失败:', error, 'data:', data);
        // 如果解析失败，返回空结果避免程序崩溃
        return { text: '', isFinal: false };
    }
};

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

/**
 * 音频录制类（基于科大讯飞官方示例）
 */
export class AudioRecorder {
    private audioContext: AudioContext | null = null;
    private stream: MediaStream | null = null;
    private processor: ScriptProcessorNode | null = null;
    private isRecording = false;
    private onDataCallback?: (data: ArrayBuffer) => void;
    private onStartCallback?: () => void;
    private onStopCallback?: () => void;
    private onErrorCallback?: (error: string) => void;
    private sampleRate: number;
    private frameSize: number;

    constructor(options: {
        sampleRate?: number;
        frameSize?: number;
        onData?: (data: ArrayBuffer) => void;
        onStart?: () => void;
        onStop?: () => void;
        onError?: (error: string) => void;
    } = {}) {
        this.onDataCallback = options.onData;
        this.onStartCallback = options.onStart;
        this.onStopCallback = options.onStop;
        this.onErrorCallback = options.onError;
        this.sampleRate = options.sampleRate || 16000;
        
        // 验证并设置 frameSize，确保是 2 的幂次方
        const requestedFrameSize = options.frameSize || 1024;
        this.frameSize = this.validateFrameSize(requestedFrameSize);
    }

    /**
     * 验证并调整 frameSize 为有效的 2 的幂次方
     * @param size 请求的帧大小
     * @returns 有效的帧大小
     */
    private validateFrameSize(size: number): number {
        // Web Audio API 要求 frameSize 必须是 0 或 256-16384 之间的 2 的幂次方
        if (size === 0) return 0;
        
        // 确保在有效范围内
        const minSize = 256;
        const maxSize = 16384;
        
        if (size < minSize) {
            console.warn(`frameSize ${size} 小于最小值 ${minSize}，使用 ${minSize}`);
            return minSize;
        }
        
        if (size > maxSize) {
            console.warn(`frameSize ${size} 大于最大值 ${maxSize}，使用 ${maxSize}`);
            return maxSize;
        }
        
        // 检查是否是 2 的幂次方
        if ((size & (size - 1)) === 0) {
            return size; // 已经是 2 的幂次方
        }
        
        // 找到最接近的 2 的幂次方
        const lowerPower = Math.pow(2, Math.floor(Math.log2(size)));
        const upperPower = Math.pow(2, Math.ceil(Math.log2(size)));
        
        // 选择更接近的值
        const closestPower = (size - lowerPower) <= (upperPower - size) ? lowerPower : upperPower;
        
        console.warn(`frameSize ${size} 不是 2 的幂次方，调整为 ${closestPower}`);
        return closestPower;
    }

    async start(): Promise<void> {
        try {
            if (this.isRecording) {
                throw new Error('录音已在进行中');
            }

            // 获取麦克风权限
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: this.sampleRate,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            // 创建音频上下文
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: this.sampleRate
            });

            const source = this.audioContext.createMediaStreamSource(this.stream);

            // 创建音频处理器 - 使用frameSize作为缓冲区大小
            this.processor = this.audioContext.createScriptProcessor(this.frameSize, 1, 1);

            this.processor.onaudioprocess = (event) => {
                if (this.isRecording && this.onDataCallback) {
                    const inputBuffer = event.inputBuffer;
                    const inputData = inputBuffer.getChannelData(0);

                    // 转换为16位PCM，按照科大讯飞要求
                    const pcmData = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
                    }

                    // 发送Int8Array格式的数据（按照官方示例）
                    const int8Data = new Int8Array(pcmData.buffer);
                    this.onDataCallback(int8Data.buffer);
                }
            };

            source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);

            this.isRecording = true;
            this.onStartCallback?.();

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : '启动录音失败';
            this.onErrorCallback?.(errorMsg);
            throw error;
        }
    }

    stop(): void {
        this.isRecording = false;

        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        this.onStopCallback?.();
    }

    isActive(): boolean {
        return this.isRecording;
    }
}
