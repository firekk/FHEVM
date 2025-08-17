// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FinanceDemo
 * @title FHE 演示财务合约
 */
contract FinanceDemo {
    // 用户角色
    enum UserRole {
        Admin,
        User
    }
    
    // 用户信息
    struct User {
        UserRole role;
        uint256 balance;
        bytes32 encryptedProfile;
    }
    
    // 交易信息
    struct Transaction {
        address from;
        address to;
        uint256 amount;
        bytes32 encryptedData;
        uint256 timestamp;
    }
    
    mapping(address => User) public users;
    mapping(uint256 => Transaction) public transactions;
    
    uint256 public transactionCounter;
    address public admin;
    
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Transferred(address indexed from, address indexed to, uint256 amount);
    event ProfileUpdated(address indexed user, bytes32 encryptedProfile);
    
    constructor() {
        admin = msg.sender;
        users[admin] = User({
            role: UserRole.Admin,
            balance: 0,
            encryptedProfile: bytes32(0)
        });
    }
    
    /**
     * @dev 注册用户
     */
    function registerUser(address _user, uint256 _initialBalance, bytes32 _encryptedProfile) external {
        require(msg.sender == admin, "Only admin");
        require(users[_user].role == UserRole(0), "User already exists");
        
        users[_user] = User({
            role: UserRole.User,
            balance: _initialBalance,
            encryptedProfile: _encryptedProfile
        });
    }
    
    /**
     * @dev 存款
     */
    function deposit(uint256 _amount, bytes32 _encryptedData) external {
        require(_amount > 0, "Amount must be positive");
        
        users[msg.sender].balance += _amount;
        
        transactionCounter++;
        transactions[transactionCounter] = Transaction({
            from: msg.sender,
            to: address(0),
            amount: _amount,
            encryptedData: _encryptedData,
            timestamp: block.timestamp
        });
        
        emit Deposited(msg.sender, _amount);
    }
    
    /**
     * @dev 取款
     */
    function withdraw(uint256 _amount, bytes32 _encryptedData) external {
        require(_amount > 0, "Amount must be positive");
        require(users[msg.sender].balance >= _amount, "Insufficient balance");
        
        users[msg.sender].balance -= _amount;
        
        transactionCounter++;
        transactions[transactionCounter] = Transaction({
            from: msg.sender,
            to: address(0),
            amount: _amount,
            encryptedData: _encryptedData,
            timestamp: block.timestamp
        });
        
        emit Withdrawn(msg.sender, _amount);
    }
    
    /**
     * @dev 转账
     */
    function transfer(address _to, uint256 _amount, bytes32 _encryptedData) external {
        require(_to != address(0), "Invalid address");
        require(_amount > 0, "Amount must be positive");
        require(users[msg.sender].balance >= _amount, "Insufficient balance");
        require(users[_to].role != UserRole(0), "Recipient not exists");
        
        users[msg.sender].balance -= _amount;
        users[_to].balance += _amount;
        
        transactionCounter++;
        transactions[transactionCounter] = Transaction({
            from: msg.sender,
            to: _to,
            amount: _amount,
            encryptedData: _encryptedData,
            timestamp: block.timestamp
        });
        
        emit Transferred(msg.sender, _to, _amount);
    }
    
    /**
     * @dev 更新加密资料
     */
    function updateEncryptedProfile(bytes32 _encryptedProfile) external {
        users[msg.sender].encryptedProfile = _encryptedProfile;
        emit ProfileUpdated(msg.sender, _encryptedProfile);
    }
    
    /**
     * @dev 获取用户信息
     */
    function getUserInfo(address _user) external view returns (UserRole role, uint256 balance, bytes32 encryptedProfile) {
        User storage user = users[_user];
        return (user.role, user.balance, user.encryptedProfile);
    }
    
    /**
     * @dev 获取交易历史
     */
    function getTransactionHistory() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= transactionCounter; i++) {
            if (transactions[i].from == msg.sender || transactions[i].to == msg.sender) {
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= transactionCounter; i++) {
            if (transactions[i].from == msg.sender || transactions[i].to == msg.sender) {
                result[index] = i;
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @dev 获取交易详情
     */
    function getTransactionDetails(uint256 _txId) external view returns (address from, address to, uint256 amount, bytes32 encryptedData, uint256 timestamp) {
        Transaction storage tx = transactions[_txId];
        return (tx.from, tx.to, tx.amount, tx.encryptedData, tx.timestamp);
    }
    
    /**
     * @dev 获取交易数量
     */
    function transactionCount() external view returns (uint256) {
        return transactionCounter;
    }
}