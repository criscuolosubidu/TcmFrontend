import { PrescriptionRecord } from '@/types';

export interface DataSource {
  filename: string;
  recordsCount: number;
  loadedAt: Date;
  source: 'public' | 'src';
  success: boolean;
  error?: string;
}

// 自动发现并加载所有prescriptions文件
export class PrescriptionFileLoader {
  private loadedSources: DataSource[] = [];

  async loadAllPrescriptionFiles(): Promise<{
    records: PrescriptionRecord[];
    sources: DataSource[];
  }> {
    const allRecords: PrescriptionRecord[] = [];
    this.loadedSources = [];

    // 1. 尝试从public目录加载文件
    await this.loadFromPublicDirectory(allRecords);

    // 2. 尝试从src目录加载文件
    await this.loadFromSrcDirectory(allRecords);

    return {
      records: allRecords,
      sources: this.loadedSources
    };
  }

  private async loadFromPublicDirectory(allRecords: PrescriptionRecord[]) {
    // 预定义的public目录文件列表
    const publicFiles = [
      'prescriptions.json',
      'prescriptions_2024.json',
      'prescriptions_backup.json',
      'prescriptions_archive.json',
    ];

    for (const filename of publicFiles) {
      try {
        const response = await fetch(`/data/${filename}`);
        if (response.ok) {
          const data: any = await response.json();
          const records = this.extractRecords(data);
          allRecords.push(...records);
          
          this.loadedSources.push({
            filename,
            recordsCount: records.length,
            loadedAt: new Date(),
            source: 'public',
            success: true
          });
        } else if (response.status === 404) {
          // 文件不存在，不记录为错误，静默跳过
          console.log(`跳过不存在的文件: /data/${filename}`);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        // 只记录真正的错误，不记录404
        if (error instanceof Error && !error.message.includes('Failed to fetch')) {
          this.loadedSources.push({
            filename,
            recordsCount: 0,
            loadedAt: new Date(),
            source: 'public',
            success: false,
            error: error.message
          });
        }
      }
    }
  }

  private async loadFromSrcDirectory(allRecords: PrescriptionRecord[]) {
    // 只尝试加载实际存在的文件
    const existingSrcFiles = [
      'prescriptions_result_1号方.json',
      'prescriptions_result_2号方.json',
      'prescriptions_result_3号方.json',
    ];

    for (const filename of existingSrcFiles) {
      try {
        const importedModule = await import(`@/data/${filename}`);
        const data: any = importedModule.default;
        const records = this.extractRecords(data);
        allRecords.push(...records);
        
        this.loadedSources.push({
          filename,
          recordsCount: records.length,
          loadedAt: new Date(),
          source: 'src',
          success: true
        });
      } catch (error) {
        // 只记录真正的错误，跳过模块不存在的情况
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes('Cannot resolve module') && !errorMessage.includes('Module not found')) {
          this.loadedSources.push({
            filename,
            recordsCount: 0,
            loadedAt: new Date(),
            source: 'src',
            success: false,
            error: errorMessage
          });
        } else {
          console.log(`跳过不存在的模块: @/data/${filename}`);
        }
      }
    }
  }

  private extractRecords(data: any): PrescriptionRecord[] {
    if (Array.isArray(data)) {
      return data;
    } else if (data && data.records && Array.isArray(data.records)) {
      return data.records;
    } else if (data && data.data && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  }

  getLoadedSources(): DataSource[] {
    return this.loadedSources;
  }

  getSuccessfulSources(): DataSource[] {
    return this.loadedSources.filter(source => source.success);
  }

  getFailedSources(): DataSource[] {
    return this.loadedSources.filter(source => !source.success);
  }

  getTotalRecordsCount(): number {
    return this.loadedSources.reduce((total, source) => total + source.recordsCount, 0);
  }
} 