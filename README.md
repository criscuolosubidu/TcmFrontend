# 处方数据文件配置说明

## 概述

系统现在支持自动加载多个以 `prescriptions` 开头的 JSON 文件。这使得您可以将不同类型的处方数据分别存储在不同的文件中，便于管理和组织。

## 支持的文件位置

系统会自动在以下位置查找处方文件：

1. **src/data/** 目录（推荐）
2. **public/data/** 目录

## 支持的文件名格式

系统会自动尝试加载以下文件名：

- `prescriptions.json` - 主要处方数据
- `prescriptions_2024.json` - 2024年处方数据
- `prescriptions_backup.json` - 备份处方数据
- `prescriptions_archive.json` - 归档处方数据

## 数据格式支持

系统支持以下JSON数据格式：

### 格式1：直接数组
```json
[
  {
    "病历编号": "001",
    "患者姓名": "张三",
    "生成状态": "成功",
    "处理时间": 1.5,
    "处方结果": "..."
  },
  // ... 更多记录
]
```

### 格式2：包含records属性的对象
```json
{
  "records": [
    {
      "病历编号": "001",
      "患者姓名": "张三",
      "生成状态": "成功",
      "处理时间": 1.5,
      "处方结果": "..."
    }
  ],
  "meta": {
    "version": "1.0",
    "description": "处方数据"
  }
}
```

### 格式3：包含data属性的对象
```json
{
  "data": [
    {
      "病历编号": "001",
      "患者姓名": "张三",
      "生成状态": "成功",
      "处理时间": 1.5,
      "处方结果": "..."
    }
  ]
}
```

## 如何添加新的数据文件

### 方法1：放在src/data目录（推荐）

1. 将您的JSON文件放在 `src/data/` 目录下
2. 文件名必须以 `prescriptions` 开头
3. 文件扩展名必须是 `.json`

### 方法2：放在public/data目录

1. 将您的JSON文件放在 `public/data/` 目录下
2. 文件名必须以 `prescriptions` 开头
3. 文件扩展名必须是 `.json`

## 自定义文件名支持

如果您需要支持其他文件名，可以修改 `src/utils/fileDiscovery.ts` 文件中的文件列表：

```typescript
// 在 loadFromPublicDirectory 方法中
const publicFiles = [
  'prescriptions.json',
  'prescriptions_2024.json',
  'prescriptions_backup.json',
  'prescriptions_archive.json',
  'prescriptions_your_custom_name.json', // 添加您的自定义文件名
];

// 在 loadFromSrcDirectory 方法中
const srcFiles = [
  'prescriptions.json',
  'prescriptions_2024.json',
  'prescriptions_backup.json',
  'prescriptions_archive.json',
  'prescriptions_your_custom_name.json', // 添加您的自定义文件名
];
```

## 数据源监控

系统现在提供了数据源监控功能：

1. 点击顶部导航栏的"数据源"按钮
2. 查看每个文件的加载状态
3. 查看记录数量和加载时间
4. 查看加载失败的原因

## 错误处理

- 如果某个文件不存在，系统会继续尝试加载其他文件
- 如果某个文件格式错误，系统会记录错误并继续处理
- 所有成功加载的数据会被合并到一个统一的数据集中

## 性能优化

- 系统会并行加载多个文件以提高性能
- 文件加载状态会被缓存，避免重复加载
- 支持增量更新和数据同步

## 最佳实践

1. **文件命名**：使用有意义的文件名，如 `prescriptions_2024.json`
2. **文件大小**：建议单个文件不超过10MB
3. **数据分离**：按时间、类型或来源分离数据到不同文件
4. **备份策略**：定期备份重要的处方数据

## 示例文件结构

```
src/
├── data/
│   ├── prescriptions.json          # 主要数据
│   ├── prescriptions_2024.json     # 2024年数据
│   ├── prescriptions_backup.json   # 备份数据
│   └── prescriptions_archive.json  # 归档数据
└── ...

public/
├── data/
│   ├── prescriptions_import.json   # 导入的数据
│   └── prescriptions_temp.json     # 临时数据
└── ...
```

这样配置后，系统会自动加载所有这些文件中的数据，并在界面上显示完整的统计信息。 

# AI聊天机器人配置说明

## 环境变量配置

为了使AI聊天机器人正常工作，您需要配置以下环境变量：

### 1. 创建环境变量文件

在项目根目录创建 `.env.local` 文件（如果不存在的话）：

```bash
# 在项目根目录执行
touch .env.local
```

### 2. 配置环境变量

在 `.env.local` 文件中添加以下配置：

```env
# OpenAI API 配置
NEXT_PUBLIC_API_KEY=your-openai-api-key-here
NEXT_PUBLIC_API_BASE_URL=https://api.openai.com/v1
NEXT_PUBLIC_MODEL_NAME=gpt-3.5-turbo
```

### 3. 获取API密钥

1. 访问 [OpenAI官网](https://platform.openai.com/api-keys)
2. 登录您的账户
3. 创建新的API密钥
4. 复制密钥并替换 `your-openai-api-key-here`

### 4. 可选配置

如果您使用的是第三方OpenAI兼容的API服务，可以修改以下配置：

```env
# 示例：使用其他兼容服务
NEXT_PUBLIC_API_BASE_URL=https://your-api-provider.com/v1
NEXT_PUBLIC_MODEL_NAME=gpt-3.5-turbo
```

## 配置文件说明

项目中的配置文件位于 `src/config/api.ts`，它会读取以下环境变量：

- `NEXT_PUBLIC_API_KEY`: OpenAI API密钥
- `NEXT_PUBLIC_API_BASE_URL`: API基础URL（默认：https://api.openai.com/v1）
- `NEXT_PUBLIC_MODEL_NAME`: 使用的模型名称（默认：gpt-3.5-turbo）

## 功能特性

### 1. 真实AI对话
- 使用OpenAI API进行真实的AI对话
- 支持上下文记忆
- 专业的中医知识问答

### 2. Markdown渲染
- 支持完整的Markdown语法
- 代码高亮显示
- 表格、列表、引用等格式化

### 3. 智能功能
- 病历分析
- 处方优化
- 辨证建议
- 知识查询

## 使用说明

1. 确保环境变量已正确配置
2. 启动开发服务器：`npm run dev`
3. 在右侧聊天面板中开始对话
4. 可以使用快速建议按钮快速开始

## 注意事项

1. **API密钥安全**：请妥善保管您的API密钥，不要泄露给他人
2. **使用限制**：请注意OpenAI API的使用限制和计费规则
3. **网络要求**：确保网络可以访问OpenAI API服务

## 故障排除

### 常见问题

1. **API调用失败**
   - 检查API密钥是否正确
   - 检查网络连接
   - 确认API额度是否充足

2. **环境变量未生效**
   - 确保文件名为 `.env.local`
   - 重启开发服务器
   - 检查变量名拼写是否正确

3. **Markdown渲染异常**
   - 检查内容格式是否正确
   - 确认相关依赖包已安装

### 技术支持

如需技术支持，请检查：
- 浏览器开发者工具的控制台错误
- 网络请求是否正常
- API响应内容是否正确

## 更新日志

- ✅ 集成OpenAI API
- ✅ 添加Markdown渲染
- ✅ 支持中医专业对话
- ✅ 添加流式响应支持
- ✅ 优化用户体验 