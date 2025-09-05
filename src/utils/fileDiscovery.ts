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
        }
      } catch (error) {
        this.loadedSources.push({
          filename,
          recordsCount: 0,
          loadedAt: new Date(),
          source: 'public',
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  private async loadFromSrcDirectory(allRecords: PrescriptionRecord[]) {
    // 预定义的src目录文件列表
    const srcFiles = [
      'prescriptions.json',
      'prescriptions_2024.json',
      'prescriptions_backup.json',
      'prescriptions_archive.json',
      // 添加用户实际的文件名
      'prescriptions_result_1号方.json',
      'prescriptions_result_2号方.json',
      'prescriptions_result_3号方.json',
    ];

    for (const filename of srcFiles) {
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
        this.loadedSources.push({
          filename,
          recordsCount: 0,
          loadedAt: new Date(),
          source: 'src',
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
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