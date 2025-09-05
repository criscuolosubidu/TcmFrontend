// 数据文件配置
export interface DataFileConfig {
  filename: string;
  path: 'public' | 'src'; // 指定文件位置
  description?: string;
  active: boolean; // 是否启用此文件
}

// 所有以prescriptions开头的JSON文件配置
export const prescriptionDataFiles: DataFileConfig[] = [
  {
    filename: 'prescriptions.json',
    path: 'src',
    description: '主要处方数据',
    active: true,
  },
  // 可以添加更多文件
  // {
  //   filename: 'prescriptions_2024.json',
  //   path: 'src',
  //   description: '2024年处方数据',
  //   active: true,
  // },
  // {
  //   filename: 'prescriptions_backup.json',
  //   path: 'src',
  //   description: '备份处方数据',
  //   active: false,
  // },
];

// 获取激活的文件列表
export const getActiveFiles = () => {
  return prescriptionDataFiles.filter(file => file.active);
};

// 获取public目录下的文件
export const getPublicFiles = () => {
  return getActiveFiles().filter(file => file.path === 'public');
};

// 获取src目录下的文件
export const getSrcFiles = () => {
  return getActiveFiles().filter(file => file.path === 'src');
}; 