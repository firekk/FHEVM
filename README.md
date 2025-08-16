# FHEVM dApp Demo

一个基于 FHEVM (Fully Homomorphic Encryption on Ethereum) 的完整去中心化应用演示，展示如何在区块链上实现隐私保护的应用。

## 项目概述

本项目演示了 FHE 技术在实际应用中的两个核心用例：
1. **私密投票系统** - 投票内容加密存储，保证投票隐私的同时确保结果可验证
2. **私密财务系统** - 余额信息和交易数据加密，保护用户隐私

## 技术栈

- **区块链**: Ethereum Hardhat Network
- **智能合约**: Solidity 0.8.28
- **前端框架**: React 18 + TypeScript
- **Web3 集成**: ethers.js + Web3Modal
- **加密技术**: 模拟 FHE 加密（实际应用需集成真实 FHE 库）
- **开发工具**: Hardhat + Vite

## 核心特性

### 🔐 FHE 加密特性
- **隐私保护**: 敏感数据在链上加密存储
- **可计算性**: 加密数据仍可进行特定计算
- **可验证性**: 结果可公开验证
- **零知识证明**: 支持零知识证明应用

### 🗳️ 私密投票系统
- 加密投票内容
- 权重投票机制
- 时间锁定功能
- 结果可验证
- 投票隐私保护

### 💰 私密财务系统
- 加密余额信息
- 私密交易数据
- 角色权限控制
- 交易历史审计
- 安全的资金管理

## 项目结构

```
FHEVM/
├── contracts/              # 智能合约
│   ├── VotingDemo.sol     # 投票演示合约
│   ├── FinanceDemo.sol    # 财务演示合约
│   └── Counter.sol        # 简单计数器合约
├── scripts/               # 部署脚本
│   └── deploy.ts         # 部署脚本
├── test/                  # 测试用例
│   ├── VotingDemo.test.ts # 投票测试
│   └── FinanceDemo.test.ts # 财务测试
├── frontend/              # 前端应用
│   ├── src/
│   │   ├── components/    # React 组件
│   │   ├── pages/         # 页面组件
│   │   ├── contexts/      # React Context
│   │   └── App.tsx        # 主应用
│   └── package.json       # 前端依赖
├── hardhat.config.ts      # Hardhat 配置
├── package.json           # 项目依赖
└── README.md             # 项目说明
```

## 安装和运行

### 前置要求
- Node.js 18+ (推荐 20+)
- yarn 或 npm
- MetaMask 或其他 Web3 钱包

### 安装依赖

1. 安装项目依赖：
```bash
npm install
```

2. 安装前端依赖：
```bash
npm install --prefix frontend
```

### 编译和测试

1. 编译智能合约：
```bash
npm run compile
```

2. 运行测试：
```bash
npm run test
```

### 部署合约

1. 部署到本地网络：
```bash
npm run deploy
```

2. 启动本地开发节点：
```bash
npm run node
```

### 启动前端

```bash
cd frontend
npm run dev
```

访问 http://localhost:3000 查看应用

## 使用说明

### 1. 私密投票系统

1. **创建投票**: 管理员可以创建新的投票议题
2. **注册投票者**: 用户需要注册并获得投票权重
3. **加密投票**: 用户选择投票选项，内容自动加密
4. **结束投票**: 投票时间结束后可以结束投票
5. **揭示结果**: 解密并显示投票结果

### 2. 私密财务系统

1. **用户注册**: 管理员可以注册新用户
2. **存款**: 用户可以存入 ETH，金额信息加密
3. **取款**: 用户可以取款，交易数据加密
4. **转账**: 用户之间可以转账，交易详情加密
5. **更新资料**: 用户可以更新加密的个人资料

### 3. FHE 技术演示

项目中的 FHE 加密目前使用模拟实现：
- 演示了 FHE 的基本概念
- 展示了加密数据的存储方式
- 说明了实际应用中的集成方法

实际生产环境需要集成真实的 FHE 库，如：
- [Zama FHE](https://github.com/zama-ai/fhe)
- [TFHE](https://github.com/tfhe/tfhe)

## 核心合约说明

### VotingDemo.sol
```solidity
// FHE 演示投票合约
- 投票选项：Yes/No/Abstain
- 模拟 FHE 加密投票内容
- 权重投票机制
- 时间锁定功能
```

### FinanceDemo.sol
```solidity
// FHE 演示财务合约
- 用户角色管理
- 加密余额信息
- 私密交易数据
- 交易历史审计
```

## 前端界面

### 主要功能
- **钱包连接**: 集成 Web3Modal 支持多种钱包
- **投票界面**: 直观的投票体验
- **财务界面**: 完整的财务管理功能
- **实时更新**: 基于 React Query 的实时数据更新

### 界面特性
- 响应式设计
- 现代化 UI/UX
- 实时状态显示
- 加密数据可视化

## 开发指南

### 添加新的 FHE 功能

1. 在智能合约中添加 FHE 加密函数：
```solidity
function tfheEncrypt(uint256 _value) internal pure returns (bytes32) {
    // 实际 FHE 加密逻辑
    return bytes32(_value + encryptionOffset);
}
```

2. 在前端集成 FHE 库：
```typescript
import { fhe } from '@fhevm/solidity';
```

3. 更新用户界面以支持新的 FHE 功能

### 测试新功能

1. 编写测试用例：
```typescript
it('should handle new FHE feature', async function () {
    // 测试逻辑
});
```

2. 运行测试：
```bash
npm test
```

## 部署到测试网

1. 配置环境变量：
```bash
export SEPOLIA_API_KEY="your-api-key"
export PRIVATE_KEY="your-private-key"
```

2. 部署到 Sepolia：
```bash
npm run deploy:sepolia
```

## 安全考虑

### 🔒 安全最佳实践
- 使用最新的 Solidity 版本
- 实施访问控制
- 进行充分的测试
- 使用 OpenZeppelin 合约标准

### ⚠️ FHE 安全注意事项
- 确保 FHE 密钥管理安全
- 定期更新 FHE 库
- 进行安全审计
- 监控异常行为

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- Email: [your-email@example.com]

## 相关资源

- [FHEVM 官方文档](https://docs.zama.ai/fhevm)
- [Hardhat 文档](https://hardhat.org/docs)
- [ethers.js 文档](https://docs.ethers.org/)
- [React 文档](https://react.dev/)

---

**注意**: 这是一个演示项目，用于展示 FHE 技术在区块链应用中的潜力。在生产环境中使用前，请确保进行充分的安全测试和审计。
