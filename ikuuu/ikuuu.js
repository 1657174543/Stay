// ==UserScript==
// @name         iKuuu VPN 多账户管理
// @namespace    http://tampermonkey.net/
// @version      3.1.0
// @description  iKuuu VPN 多账户管理和自动登录
// @author       iKuuu Helper
// @match        https://ikuuu.de/auth/login
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ikuuu.de
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @run-at       document-end
// @supportURL   https://github.com/your-repo
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // 账户管理器
    class AccountManager {
        constructor() {
            this.currentAccount = null;
            this.accounts = this.loadAccounts();
            this.isProcessing = false;
            this.addFormVisible = false;
            this.init();
        }

        // 初始化
        init() {
            console.log('iKuuu 账户管理器初始化');
            this.injectStyles();
            this.addAccountButton();
            this.checkAutoLogin();
        }

        // 注入样式
        injectStyles() {
            const styles = `
                /* 账户管理按钮样式 */
                .ik-account-btn {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 50px;
                    padding: 10px 20px;
                    font-size: 13px;
                    font-weight: bold;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.3s ease;
                }
                
                .ik-account-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.25);
                }
                
                /* 账户管理面板 */
                .ik-account-panel {
                    position: fixed;
                    top: 60px;
                    right: 20px;
                    width: 320px;
                    max-height: 60vh;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                    z-index: 10000;
                    overflow: hidden;
                    animation: ik-panelSlide 0.2s ease;
                    border: 1px solid #e1e5e9;
                }
                
                @keyframes ik-panelSlide {
                    from { opacity: 0; transform: translateY(-10px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                
                .ik-account-panel-header {
                    padding: 12px 15px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .ik-account-panel-header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                }
                
                .ik-account-panel-close {
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                }
                
                .ik-account-panel-close:hover {
                    background: rgba(255,255,255,0.3);
                }
                
                .ik-account-panel-content {
                    padding: 15px;
                    max-height: 50vh;
                    overflow-y: auto;
                }
                
                /* 账户列表 */
                .ik-account-list {
                    margin-bottom: 12px;
                }
                
                .ik-account-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px 12px;
                    margin-bottom: 6px;
                    background: #f8f9fa;
                    border-radius: 6px;
                    border: 1px solid #e9ecef;
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                
                .ik-account-item:hover {
                    background: #e9ecef;
                    border-color: #dee2e6;
                }
                
                .ik-account-item.active {
                    background: #e3f2fd;
                    border-color: #2196f3;
                }
                
                .ik-account-info {
                    flex: 1;
                    min-width: 0;
                }
                
                .ik-account-email {
                    font-weight: 600;
                    color: #333;
                    font-size: 13px;
                    margin-bottom: 2px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .ik-account-note {
                    font-size: 11px;
                    color: #666;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .ik-account-actions {
                    display: flex;
                    gap: 6px;
                }
                
                .ik-account-action-btn {
                    padding: 4px 8px;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 11px;
                    font-weight: 600;
                    transition: all 0.2s ease;
                }
                
                .ik-btn-login {
                    background: #4CAF50;
                    color: white;
                }
                
                .ik-btn-login:hover {
                    background: #388e3c;
                }
                
                .ik-btn-delete {
                    background: #f44336;
                    color: white;
                }
                
                .ik-btn-delete:hover {
                    background: #d32f2f;
                }
                
                /* 添加账户区域 - 修改了这部分样式 */
                .ik-add-account-section {
                    border-top: 1px solid #e9ecef;
                    padding-top: 12px;
                }
                
                .ik-add-account-toggle {
                    width: 100%;
                    padding: 8px 12px;
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    color: #495057;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    transition: all 0.2s;
                }
                
                .ik-add-account-toggle:hover {
                    background: #e9ecef;
                }
                
                .ik-toggle-icon {
                    transition: transform 0.2s;
                }
                
                .ik-add-account-form {
                    background: #f8f9fa;
                    padding: 12px;
                    border-radius: 6px;
                    margin-top: 8px;
                    display: block; /* 修改为始终显示 */
                }
                
                .ik-form-group {
                    margin-bottom: 10px;
                }
                
                .ik-form-group label {
                    display: block;
                    margin-bottom: 4px;
                    color: #495057;
                    font-size: 12px;
                    font-weight: 600;
                }
                
                .ik-form-input {
                    width: 100%;
                    padding: 8px 10px;
                    border: 1px solid #ced4da;
                    border-radius: 4px;
                    font-size: 13px;
                    box-sizing: border-box;
                    transition: border 0.2s;
                }
                
                .ik-form-input:focus {
                    outline: none;
                    border-color: #667eea;
                }
                
                .ik-form-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: 12px;
                }
                
                .ik-btn-primary {
                    flex: 1;
                    padding: 8px 12px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 4px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .ik-btn-primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
                
                /* 设置区域 */
                .ik-settings {
                    margin-top: 12px;
                    padding-top: 12px;
                    border-top: 1px solid #e9ecef;
                }
                
                .ik-setting-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                
                .ik-setting-label {
                    color: #495057;
                    font-size: 12px;
                    font-weight: 600;
                }
                
                /* 自动登录开关 */
                .ik-switch {
                    position: relative;
                    display: inline-block;
                    width: 40px;
                    height: 20px;
                }
                
                .ik-switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                
                .ik-slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                }
                
                .ik-slider:before {
                    position: absolute;
                    content: "";
                    height: 16px;
                    width: 16px;
                    left: 2px;
                    bottom: 2px;
                    background-color: white;
                    transition: .4s;
                }
                
                input:checked + .ik-slider {
                    background-color: #4CAF50;
                }
                
                input:checked + .ik-slider:before {
                    transform: translateX(20px);
                }
                
                .ik-slider.ik-round {
                    border-radius: 20px;
                }
                
                .ik-slider.ik-round:before {
                    border-radius: 50%;
                }
                
                /* 消息通知 */
                .ik-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 10px 16px;
                    background: #4CAF50;
                    color: white;
                    border-radius: 4px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    z-index: 10001;
                    animation: ik-slideIn 0.3s ease;
                    font-size: 12px;
                    max-width: 300px;
                }
                
                @keyframes ik-slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                .ik-notification.error {
                    background: #f44336;
                }
                
                .ik-notification.warning {
                    background: #ff9800;
                }
                
                .ik-notification.info {
                    background: #2196F3;
                }
                
                /* 空状态 */
                .ik-empty-state {
                    text-align: center;
                    padding: 20px 15px;
                    color: #999;
                }
                
                .ik-empty-state-icon {
                    font-size: 32px;
                    margin-bottom: 8px;
                }
                
                /* 滚动条样式 */
                .ik-account-panel-content::-webkit-scrollbar {
                    width: 6px;
                }
                
                .ik-account-panel-content::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 3px;
                }
                
                .ik-account-panel-content::-webkit-scrollbar-thumb {
                    background: #c1c1c1;
                    border-radius: 3px;
                }
                
                .ik-account-panel-content::-webkit-scrollbar-thumb:hover {
                    background: #a8a8a8;
                }
                
                /* 响应式 */
                @media (max-width: 768px) {
                    .ik-account-panel {
                        width: 280px;
                        right: 10px;
                        top: 50px;
                    }
                    
                    .ik-account-btn {
                        right: 10px;
                        padding: 8px 16px;
                        font-size: 12px;
                    }
                }
                
                /* 加载中 */
                .ik-loading {
                    display: inline-block;
                    width: 12px;
                    height: 12px;
                    border: 2px solid rgba(255,255,255,0.3);
                    border-radius: 50%;
                    border-top-color: white;
                    animation: ik-spin 1s ease-in-out infinite;
                    margin-right: 6px;
                }
                
                @keyframes ik-spin {
                    to { transform: rotate(360deg); }
                }
                
                /* 登录按钮加载状态 */
                .ik-btn-login.loading {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                
                /* 添加表单折叠/展开样式 */
                .ik-add-account-form.collapsed {
                    display: none;
                }
                
                .ik-add-account-form.expanded {
                    display: block;
                }
            `;
            
            const style = document.createElement('style');
            style.textContent = styles;
            document.head.appendChild(style);
        }

        // 加载账户列表
        loadAccounts() {
            const accountsStr = GM_getValue('ikuuu_accounts', '[]');
            try {
                return JSON.parse(accountsStr);
            } catch (e) {
                console.error('加载账户列表失败:', e);
                return [];
            }
        }

        // 保存账户列表
        saveAccounts() {
            try {
                GM_setValue('ikuuu_accounts', JSON.stringify(this.accounts));
                return true;
            } catch (e) {
                console.error('保存账户列表失败:', e);
                return false;
            }
        }

        // 添加账户
        addAccount(email, password, note = '') {
            if (this.isProcessing) return false;
            this.isProcessing = true;
            
            try {
                if (!email || !password) {
                    this.showNotification('邮箱和密码不能为空', 'error');
                    return false;
                }
                
                // 检查是否已存在
                const exists = this.accounts.some(acc => acc.email === email);
                if (exists) {
                    this.showNotification('账户已存在', 'warning');
                    return false;
                }
                
                const newAccount = {
                    id: Date.now().toString(),
                    email: email.trim(),
                    password: password,
                    note: note.trim(),
                    created: new Date().toISOString(),
                    lastUsed: null
                };
                
                this.accounts.push(newAccount);
                const success = this.saveAccounts();
                if (success) {
                    this.showNotification('账户添加成功', 'success');
                    this.renderAccountList();
                    
                    // 如果是第一个账户，设置为当前账户
                    if (this.accounts.length === 1) {
                        this.setCurrentAccount(newAccount.id);
                    }
                    
                    // 清空表单
                    this.clearAddForm();
                } else {
                    this.showNotification('保存失败', 'error');
                }
                return success;
            } finally {
                this.isProcessing = false;
            }
        }

        // 删除账户
        deleteAccount(id) {
            if (this.isProcessing) return false;
            this.isProcessing = true;
            
            try {
                const index = this.accounts.findIndex(acc => acc.id === id);
                if (index === -1) {
                    this.showNotification('账户不存在', 'error');
                    return false;
                }
                
                this.accounts.splice(index, 1);
                const success = this.saveAccounts();
                if (success) {
                    this.showNotification('账户删除成功', 'success');
                    this.renderAccountList();
                    
                    // 如果删除的是当前账户，重置当前账户
                    if (this.currentAccount && this.currentAccount.id === id) {
                        this.currentAccount = null;
                        GM_setValue('defaultAccount', null);
                    }
                } else {
                    this.showNotification('删除失败', 'error');
                }
                return success;
            } finally {
                this.isProcessing = false;
            }
        }

        // 设置当前账户
        setCurrentAccount(accountId, autoLogin = false) {
            if (this.isProcessing) return false;
            this.isProcessing = true;
            
            try {
                const account = this.accounts.find(acc => acc.id === accountId);
                if (!account) {
                    this.showNotification('账户不存在', 'error');
                    return false;
                }
                
                this.currentAccount = account;
                GM_setValue('defaultAccount', accountId);
                
                // 更新最后使用时间
                account.lastUsed = new Date().toISOString();
                this.saveAccounts();
                
                this.showNotification('已选择账户: ' + account.email, 'success');
                this.renderAccountList();
                
                // 填充表单
                const fillResult = this.fillFormWithAccount(account);
                
                if (fillResult && autoLogin) {
                    // 延迟自动登录
                    setTimeout(() => {
                        this.autoLogin();
                    }, 1000);
                }
                
                return fillResult;
            } finally {
                this.isProcessing = false;
            }
        }

        // 填充表单
        fillFormWithAccount(account) {
            if (!account) {
                this.showNotification('账户不存在', 'error');
                return false;
            }
            
            const emailInput = document.getElementById('email') || 
                              document.querySelector('input[name="email"]') ||
                              document.querySelector('input[type="email"]');
            
            const passwordInput = document.getElementById('password') || 
                                 document.querySelector('input[name="password"]') ||
                                 document.querySelector('input[type="password"]');
            
            if (!emailInput || !passwordInput) {
                this.showNotification('未找到表单输入框', 'warning');
                return false;
            }
            
            try {
                emailInput.value = account.email;
                passwordInput.value = account.password;
                
                // 修改密码字段名
                if (passwordInput.name === 'password') {
                    passwordInput.name = 'passwd';
                }
                
                // 添加隐藏字段
                this.addHiddenFields();
                
                // 触发输入事件
                emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                
                this.showNotification(`已填充账户: ${account.email}`, 'success');
                return true;
            } catch (e) {
                console.error('填充表单失败:', e);
                this.showNotification('填充表单失败', 'error');
                return false;
            }
        }

        // 登录账户
        async loginWithAccount(accountId) {
            if (this.isProcessing) return false;
            this.isProcessing = true;
            
            try {
                const account = this.accounts.find(acc => acc.id === accountId);
                if (!account) {
                    this.showNotification('账户不存在', 'error');
                    return false;
                }
                
                // 设置当前账户
                this.currentAccount = account;
                GM_setValue('defaultAccount', accountId);
                
                // 更新最后使用时间
                account.lastUsed = new Date().toISOString();
                this.saveAccounts();
                
                this.showNotification(`正在登录: ${account.email}`, 'info');
                this.renderAccountList();
                
                // 填充表单
                const fillResult = this.fillFormWithAccount(account);
                if (!fillResult) {
                    this.isProcessing = false;
                    return false;
                }
                
                // 延迟自动登录
                setTimeout(() => {
                    this.autoLogin();
                }, 1000);
                
                return true;
            } finally {
                this.isProcessing = false;
            }
        }

        // 自动登录
        autoLogin() {
            const form = document.querySelector('form');
            const submitButton = form.querySelector('button[type="submit"]') || 
                                form.querySelector('input[type="submit"]');
            
            if (form && submitButton) {
                this.showNotification('正在登录...', 'info');
                setTimeout(() => {
                    try {
                        submitButton.click();
                    } catch (e) {
                        console.error('自动登录失败:', e);
                        this.showNotification('自动登录失败，请手动登录', 'error');
                    }
                }, 1000);
            } else {
                this.showNotification('未找到登录按钮', 'warning');
            }
        }

        // 检查自动登录
        checkAutoLogin() {
            const autoLogin = GM_getValue('autoLogin', false);
            const defaultAccount = GM_getValue('defaultAccount');
            
            if (autoLogin && defaultAccount) {
                const account = this.accounts.find(acc => acc.id === defaultAccount);
                if (account) {
                    this.showNotification('自动登录中...', 'info');
                    setTimeout(() => {
                        this.loginWithAccount(defaultAccount);
                    }, 1500);
                }
            }
        }

        // 添加隐藏字段
        addHiddenFields() {
            const form = document.querySelector('form');
            if (!form) return;
            
            const fields = [
                { name: 'host', value: 'ikuuu.de' },
                { name: 'code', value: '' },
                { name: 'pageLoadedAt', value: Date.now() }
            ];
            
            fields.forEach(field => {
                let input = form.querySelector(`input[name="${field.name}"]`);
                if (!input) {
                    input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = field.name;
                    form.appendChild(input);
                }
                input.value = field.value;
            });
        }

        // 显示通知
        showNotification(message, type = 'success') {
            // 移除旧的通知
            const oldNotice = document.querySelector('.ik-notification');
            if (oldNotice) oldNotice.remove();
            
            const notice = document.createElement('div');
            notice.className = `ik-notification ${type}`;
            notice.textContent = message;
            
            document.body.appendChild(notice);
            
            // 3秒后自动移除
            setTimeout(() => {
                if (notice.parentNode) {
                    notice.style.opacity = '0';
                    notice.style.transition = 'opacity 0.3s ease';
                    setTimeout(() => {
                        if (notice.parentNode) notice.remove();
                    }, 300);
                }
            }, 3000);
        }

        // 清空添加表单
        clearAddForm() {
            const emailInput = document.getElementById('ik-new-email');
            const passwordInput = document.getElementById('ik-new-password');
            const noteInput = document.getElementById('ik-new-note');
            
            if (emailInput) emailInput.value = '';
            if (passwordInput) passwordInput.value = '';
            if (noteInput) noteInput.value = '';
        }

        // 验证邮箱格式
        validateEmail(email) {
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return re.test(email);
        }

        // HTML转义
        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // 添加账户管理按钮
        addAccountButton() {
            const button = document.createElement('button');
            button.className = 'ik-account-btn';
            button.innerHTML = `
                <span style="font-size: 16px;">👤</span>
                <span>账户管理 (${this.accounts.length})</span>
            `;
            
            button.onclick = () => this.showAccountPanel();
            
            document.body.appendChild(button);
        }

        // 显示账户管理面板
        showAccountPanel() {
            // 如果已存在面板，先移除
            const existingPanel = document.getElementById('ik-account-panel');
            if (existingPanel) {
                existingPanel.remove();
                return;
            }
            
            const panel = document.createElement('div');
            panel.id = 'ik-account-panel';
            panel.className = 'ik-account-panel';
            
            panel.innerHTML = `
                <div class="ik-account-panel-header">
                    <h3>iKuuu 账户管理</h3>
                    <button class="ik-account-panel-close" id="ik-close-panel">×</button>
                </div>
                <div class="ik-account-panel-content">
                    <div class="ik-account-list" id="ik-account-list-container">
                        ${this.renderAccountListHTML()}
                    </div>
                    <div class="ik-add-account-section">
                        <button class="ik-add-account-toggle" id="ik-toggle-add-form">
                            <span>${this.addFormVisible ? '收起' : '展开'}添加账户表单</span>
                            <span class="ik-toggle-icon" id="ik-toggle-icon">▼</span>
                        </button>
                        <div class="ik-add-account-form ${this.addFormVisible ? 'expanded' : 'collapsed'}" id="ik-add-account-form">
                            <div class="ik-form-group">
                                <label>邮箱地址</label>
                                <input type="email" class="ik-form-input" id="ik-new-email" placeholder="请输入邮箱地址">
                            </div>
                            <div class="ik-form-group">
                                <label>密码</label>
                                <input type="password" class="ik-form-input" id="ik-new-password" placeholder="请输入密码">
                            </div>
                            <div class="ik-form-group">
                                <label>备注 (可选)</label>
                                <input type="text" class="ik-form-input" id="ik-new-note" placeholder="例如：工作账户、个人账户等">
                            </div>
                            <div class="ik-form-actions">
                                <button class="ik-btn-primary" id="ik-add-account-btn">添加账户</button>
                            </div>
                        </div>
                    </div>
                    <div class="ik-settings">
                        <h4>设置</h4>
                        <div class="ik-setting-item">
                            <span class="ik-setting-label">自动登录</span>
                            <label class="ik-switch">
                                <input type="checkbox" id="ik-auto-login-switch" ${GM_getValue('autoLogin', false) ? 'checked' : ''}>
                                <span class="ik-slider ik-round"></span>
                            </label>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(panel);
            
            // 绑定事件
            this.bindPanelEvents();
            
            // 显示面板
            panel.style.display = 'block';
            
            // 点击外部关闭面板
            setTimeout(() => {
                document.addEventListener('click', (e) => {
                    if (!panel.contains(e.target) && !e.target.closest('.ik-account-btn')) {
                        panel.remove();
                    }
                });
            }, 100);
            
            // ESC键关闭面板
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && panel.parentNode) {
                    panel.remove();
                }
            });
        }

        // 渲染账户列表HTML
        renderAccountListHTML() {
            if (this.accounts.length === 0) {
                return `
                    <div class="ik-empty-state">
                        <div class="ik-empty-state-icon">📁</div>
                        <p>暂无账户</p>
                        <p style="font-size: 12px; margin-top: 4px;">请添加您的第一个账户</p>
                    </div>
                `;
            }
            
            return this.accounts.map(account => `
                <div class="ik-account-item ${this.currentAccount && this.currentAccount.id === account.id ? 'active' : ''}" 
                     data-id="${account.id}">
                    <div class="ik-account-info">
                        <div class="ik-account-email" title="${this.escapeHtml(account.email)}">${this.escapeHtml(account.email)}</div>
                        <div class="ik-account-note" title="${this.escapeHtml(account.note || '无备注')}">${this.escapeHtml(account.note || '无备注')}</div>
                    </div>
                    <div class="ik-account-actions">
                        <button class="ik-account-action-btn ik-btn-login" data-id="${account.id}" title="登录账户">登录</button>
                        <button class="ik-account-action-btn ik-btn-delete" data-id="${account.id}" title="删除账户">删除</button>
                    </div>
                </div>
            `).join('');
        }

        // 重新渲染账户列表
        renderAccountList() {
            const container = document.getElementById('ik-account-list-container');
            if (container) {
                container.innerHTML = this.renderAccountListHTML();
                this.bindAccountEvents();
            }
            
            // 更新账户按钮上的账户数量
            const accountBtn = document.querySelector('.ik-account-btn span:nth-child(2)');
            if (accountBtn) {
                accountBtn.textContent = `账户管理 (${this.accounts.length})`;
            }
        }

        // 绑定面板事件
        bindPanelEvents() {
            const panel = document.getElementById('ik-account-panel');
            if (!panel) return;
            
            // 关闭按钮
            const closeBtn = panel.querySelector('#ik-close-panel');
            if (closeBtn) {
                closeBtn.onclick = () => panel.remove();
            }
            
            // 折叠/展开添加表单按钮
            const toggleBtn = panel.querySelector('#ik-toggle-add-form');
            const toggleIcon = panel.querySelector('#ik-toggle-icon');
            const addForm = panel.querySelector('#ik-add-account-form');
            
            if (toggleBtn && addForm && toggleIcon) {
                toggleBtn.onclick = () => {
                    this.addFormVisible = !this.addFormVisible;
                    toggleBtn.querySelector('span:first-child').textContent = 
                        this.addFormVisible ? '收起' : '展开';
                    
                    if (this.addFormVisible) {
                        addForm.classList.remove('collapsed');
                        addForm.classList.add('expanded');
                        toggleIcon.style.transform = 'rotate(180deg)';
                    } else {
                        addForm.classList.remove('expanded');
                        addForm.classList.add('collapsed');
                        toggleIcon.style.transform = 'rotate(0deg)';
                    }
                };
                
                // 设置初始状态
                if (this.addFormVisible) {
                    addForm.classList.remove('collapsed');
                    addForm.classList.add('expanded');
                    toggleIcon.style.transform = 'rotate(180deg)';
                } else {
                    addForm.classList.remove('expanded');
                    addForm.classList.add('collapsed');
                    toggleIcon.style.transform = 'rotate(0deg)';
                }
            }
            
            // 添加账户按钮
            const addBtn = panel.querySelector('#ik-add-account-btn');
            if (addBtn) {
                addBtn.onclick = () => this.handleAddAccount();
            }
            
            // 自动登录开关
            const autoLoginSwitch = panel.querySelector('#ik-auto-login-switch');
            if (autoLoginSwitch) {
                autoLoginSwitch.onchange = (e) => {
                    GM_setValue('autoLogin', e.target.checked);
                    this.showNotification(`自动登录已${e.target.checked ? '开启' : '关闭'}`, 'info');
                };
            }
            
            // 绑定账户事件
            this.bindAccountEvents();
            
            // 表单回车提交
            const formInputs = panel.querySelectorAll('#ik-new-email, #ik-new-password, #ik-new-note');
            formInputs.forEach(input => {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleAddAccount();
                    }
                });
            });
        }

        // 绑定账户事件
        bindAccountEvents() {
            const container = document.getElementById('ik-account-list-container');
            if (!container) return;
            
            // 登录按钮事件
            container.querySelectorAll('.ik-btn-login').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    const accountId = btn.getAttribute('data-id');
                    if (accountId) {
                        this.loginWithAccount(accountId);
                    }
                };
            });
            
            // 删除按钮事件
            container.querySelectorAll('.ik-btn-delete').forEach(btn => {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    const accountId = btn.getAttribute('data-id');
                    if (accountId && confirm('确定要删除这个账户吗？')) {
                        this.deleteAccount(accountId);
                    }
                };
            });
            
            // 账户项点击事件
            container.querySelectorAll('.ik-account-item').forEach(item => {
                item.onclick = (e) => {
                    if (!e.target.closest('.ik-account-actions')) {
                        const accountId = item.getAttribute('data-id');
                        if (accountId) {
                            this.setCurrentAccount(accountId);
                        }
                    }
                };
            });
        }

        // 处理添加账户
        handleAddAccount() {
            if (this.isProcessing) return;
            
            const emailInput = document.getElementById('ik-new-email');
            const passwordInput = document.getElementById('ik-new-password');
            const noteInput = document.getElementById('ik-new-note');
            
            if (!emailInput || !passwordInput) return;
            
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            const note = noteInput ? noteInput.value.trim() : '';
            
            if (!email) {
                this.showNotification('邮箱不能为空', 'error');
                emailInput.focus();
                return;
            }
            
            if (!password) {
                this.showNotification('密码不能为空', 'error');
                passwordInput.focus();
                return;
            }
            
            if (!this.validateEmail(email)) {
                this.showNotification('邮箱格式不正确', 'error');
                emailInput.focus();
                return;
            }
            
            this.addAccount(email, password, note);
        }
    }

    // 初始化函数
    function init() {
        console.log('iKuuu 多账户管理脚本启动');
        
        // 创建账户管理器实例
        window.accountManager = new AccountManager();
        
        // 等待页面加载完成后检查表单
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(checkForm, 1000);
            });
        } else {
            setTimeout(checkForm, 1000);
        }
        
        // 检查表单是否存在的函数
        function checkForm() {
            const emailInput = document.getElementById('email') || 
                              document.querySelector('input[name="email"]') ||
                              document.querySelector('input[type="email"]');
            
            if (emailInput) {
                console.log('登录表单已找到');
            } else {
                console.log('等待登录表单...');
                setTimeout(checkForm, 1000);
            }
        }
    }

    // 启动脚本
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
