const API_URL = '/api';

// --- Global Exports (Safety First) ---
// Define these early so HTML onclicks work even if later code crashes
window.logout = function () {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
};
window.openModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
};
window.closeModal = function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
};
window.confirmPayment = confirmPayment;
window.openCardModal = openCardModal;
window.printCard = printCard;
window.deleteUser = deleteUser;
window.deleteClient = deleteClient;
window.openEditClientModal = openEditClientModal;
window.showSection = showSection;

// --- Login Logic ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('user', JSON.stringify(data));
                window.location.href = 'dashboard.html';
            } else {
                if (errorMessage) {
                    errorMessage.innerText = data.message || 'Falha no login';
                    errorMessage.classList.remove('hidden');
                } else {
                    alert(data.message || 'Falha no login');
                }
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão');
        }
    });
}

// --- Dashboard Logic ---
if (window.location.pathname.includes('dashboard.html')) {
    checkAuth(); // Redirect if not logged in

    // Load initial data
    document.addEventListener('DOMContentLoaded', () => {
        try {
            setupUserHeader();

            const userStr = localStorage.getItem('user');
            if (!userStr) {
                window.location.href = 'index.html';
                return;
            }

            let user;
            try {
                user = JSON.parse(userStr);
                if (!user || typeof user !== 'object') throw new Error('Invalid user object');
                if (!user.role) {
                    console.error('User role is missing');
                    // Force logout for invalid role
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    alert('Erro de permissão: Função de usuário não identificada. Por favor, faça login novamente.');
                    window.location.href = 'index.html';
                    return;
                }
            } catch (e) {
                console.error('Corrupted user data', e);
                window.logout(); // Force logout
                return;
            }

            console.log('Logged user:', user); // Debug

            if (user.force_password_change) {
                document.getElementById('forcePasswordModal').classList.remove('hidden');
                setupForcePasswordForm();
            }

            if (user.role === 'cliente') {
                // Client View
                console.log('Loading Client View');

                // Toggle Navigation
                const navAdmin = document.getElementById('navAdmin');
                const navClient = document.getElementById('navClient');
                if (navAdmin) navAdmin.classList.add('hidden');
                if (navClient) navClient.classList.remove('hidden');

                // Hide Admin Content Sections
                const adminSections = ['sectionClients', 'sectionEmployees'];
                adminSections.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.classList.add('hidden');
                });

                // Load Portal
                loadClientPortal();
                // Show Home by default
                showSection('clientHome');
            } else {
                // Admin/Employee View
                console.log('Loading Admin View');

                // Toggle Navigation
                const navAdmin = document.getElementById('navAdmin');
                const navClient = document.getElementById('navClient');
                if (navAdmin) navAdmin.classList.remove('hidden');
                if (navClient) navClient.classList.add('hidden');

                // Show Admin Default Section
                const sectionClients = document.getElementById('sectionClients');
                if (sectionClients) sectionClients.classList.remove('hidden');

                loadStats();
                loadClients();
                checkAdminAccess();
            }
        } catch (err) {
            console.error('Fatal error in Dashboard initialization:', err);
            // Fallback: force logout on fatal error
            alert(`Erro crítico ao carregar o sistema: ${err.message || err}. A sessão será reiniciada.`);
            window.logout();
        }
    });

    // Client Form Submit
    const clientForm = document.getElementById('clientForm');
    if (clientForm) {
        clientForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('clientEmail').value;
            const cpf = document.getElementById('cpf').value;
            const phone = document.getElementById('phone').value;
            const plan = document.getElementById('plan').value;
            let val = 40;
            if (plan === 'Plus Familia') val = 50;
            else if (plan === 'Premium') val = 60;
            else if (plan === 'Premium Familia') val = 110;
            const value = val;

            try {
                const res = await authenticatedFetch(`${API_URL}/clients`, {
                    method: 'POST',
                    body: JSON.stringify({ name, email, cpf, phone, plan, value })
                });

                if (res.ok) {
                    window.closeModal('clientModal');
                    clientForm.reset();
                    loadClients();
                    loadStats();
                    alert('Cliente cadastrado com sucesso!');
                } else {
                    const data = await res.json();
                    alert(data.message || 'Erro ao criar cliente');
                }
            } catch (err) {
                console.error(err);
                alert('Erro de conexão');
            }
        });
    }

    // Edit Client Form Submit
    const editClientForm = document.getElementById('editClientForm');
    if (editClientForm) {
        editClientForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('editClientId').value;
            const name = document.getElementById('editName').value;
            const cpf = document.getElementById('editCpf').value;
            const phone = document.getElementById('editPhone').value;
            const plan = document.getElementById('editPlan').value;
            const status = document.getElementById('editStatus').value;
            const next_due_date = document.getElementById('editNextDue').value;

            try {
                const res = await authenticatedFetch(`${API_URL}/clients/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({ name, cpf, phone, plan, status, next_due_date })
                });

                if (res.ok) {
                    window.closeModal('editClientModal');
                    loadClients();
                    loadStats();
                    alert('Cliente atualizado com sucesso!');
                } else {
                    const data = await res.json();
                    alert(data.message || 'Erro ao atualizar cliente');
                }
            } catch (err) {
                console.error(err);
                alert('Erro de conexão');
            }
        });
    }

    // Employee Form Submit
    const employeeForm = document.getElementById('employeeForm');
    if (employeeForm) {
        employeeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('empName').value;
            const email = document.getElementById('empEmail').value;
            const password = document.getElementById('empPassword').value;
            const role = document.getElementById('empRole').value;

            try {
                const res = await authenticatedFetch(`${API_URL}/users`, {
                    method: 'POST',
                    body: JSON.stringify({ name, email, password, role })
                });

                if (res.ok) {
                    window.closeModal('employeeModal');
                    employeeForm.reset();
                    loadEmployees();
                    alert('Funcionário criado com sucesso!');
                } else {
                    const data = await res.json();
                    alert(data.message || 'Erro ao criar funcionário');
                }
            } catch (err) {
                console.error(err);
                alert('Erro de conexão');
            }
        });
    }
}

// --- Navigation Logic --- (unchanged)
function showSection(sectionId) {
    document.getElementById('sectionClients').classList.add('hidden');
    document.getElementById('sectionEmployees')?.classList.add('hidden');
    document.getElementById('sectionReports')?.classList.add('hidden');
    document.getElementById('sectionClientData')?.classList.add('hidden');
    document.getElementById('sectionClientHome')?.classList.add('hidden');

    const navClients = document.getElementById('navResultClients');
    if (navClients) navClients.classList.remove('border-accent-400', 'border-l-4', 'bg-brand-800');

    const navEmps = document.getElementById('navEmployees');
    if (navEmps) navEmps.classList.remove('border-accent-400', 'border-l-4', 'bg-brand-800');

    const navReports = document.getElementById('navReports');
    if (navReports) navReports.classList.remove('border-accent-400', 'border-l-4', 'bg-brand-800');

    const navClientHome = document.getElementById('navResultClientHome');
    if (navClientHome) navClientHome.classList.remove('border-accent-400', 'border-l-4', 'bg-brand-800');

    const navClientData = document.getElementById('navResultClientData');
    if (navClientData) navClientData.classList.remove('bg-brand-800', 'bg-opacity-25', 'text-gray-100');

    if (sectionId === 'clients') {
        document.getElementById('sectionClients').classList.remove('hidden');
        if (navClients) navClients.classList.add('border-accent-400', 'border-l-4', 'bg-brand-800');
    } else if (sectionId === 'employees') {
        document.getElementById('sectionEmployees').classList.remove('hidden');
        if (navEmps) navEmps.classList.add('border-accent-400', 'border-l-4', 'bg-brand-800');
        loadEmployees();
    } else if (sectionId === 'reports') {
        document.getElementById('sectionReports').classList.remove('hidden');
        if (navReports) navReports.classList.add('border-accent-400', 'border-l-4', 'bg-brand-800');
        loadReports();
    } else if (sectionId === 'clientData') {
        document.getElementById('sectionClientData')?.classList.remove('hidden');
        loadClientDataForForm();
    } else if (sectionId === 'clientHome') {
        document.getElementById('sectionClientHome')?.classList.remove('hidden');
        if (navClientHome) navClientHome.classList.add('border-accent-400', 'border-l-4', 'bg-brand-800');
    }
}

// ... (Rest of functions: loadClientDataForForm, loadClientPortal, loadEmployees, loadStats, loadClients, confirmPayment, openCardModal, printCard, checkAuth, checkAdminAccess, authenticatedFetch, getStatusColor, formatDate, formatCurrency)
// Keep function definitions below as they are hoisted or used by reference.

function checkAdminAccess() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user.role === 'admin') {
                const empNav = document.getElementById('navEmployees');
                if (empNav) empNav.classList.remove('hidden');

                const repNav = document.getElementById('navReports');
                if (repNav) repNav.classList.remove('hidden');
            }
        } catch (e) {
            console.error('Error parsing user for admin check', e);
        }
    }
}

// Helper to get plan benefits
function getPlanBenefits(plan) {
    const benefits = {
        'Plus': [
            'Carteirinha 100% Digital', 'Titular Individual', 'Hospital Dia Dr. Giovani',
            '> 20 Especialidades Médicas', 'Exames e Diagnósticos', 'Procedimentos Ortopédicos', 'Rede de Parceiros'
        ],
        'Plus Familia': [
            'Carteirinha 100% Digital', 'Titular + 4 Dependentes', 'Hospital Dia Dr. Giovani',
            '> 20 Especialidades Médicas', 'Exames e Diagnósticos', 'Procedimentos Ortopédicos', 'Rede de Parceiros'
        ],
        'Premium': [
            'Tudo do Plano Plus', 'Descontos em Cirurgias (Exclusivo)'
        ],
        'Premium Familia': [
            'Tudo do Plano Plus Família', 'Descontos em Cirurgias (Exclusivo)'
        ]
    };
    return benefits[plan] || ['Acesso às dependências', 'Carteirinha Digital'];
}

async function loadClientDataForForm() {
    try {
        const res = await authenticatedFetch(`${API_URL}/portal/me`);
        if (res.ok) {
            const client = await res.json();

            // Populate Read-Only Fields
            document.getElementById('myDataName').value = client.name || '';
            document.getElementById('myDataCpf').value = client.cpf || '';
            document.getElementById('myDataPlan').value = client.plan || '';

            // Populate Editable Fields
            document.getElementById('myDataPhone').value = client.phone || '';
            document.getElementById('myDataEmail').value = client.email || '';
            document.getElementById('myDataPassword').value = ''; // Clean

            // Populate Photo Preview
            const preview = document.getElementById('previewPhoto');
            if (client.photo_url && preview) {
                preview.src = client.photo_url;
            }
            const chk = document.getElementById('showPhoto');
            if (chk) chk.checked = client.show_photo === 1;

            // Setup Plan Details Modal
            const planList = document.getElementById('modalPlanList');
            const planTitle = document.getElementById('modalPlanTitle');
            if (planList && planTitle) {
                planTitle.innerText = `Benefícios do Plano ${client.plan}`;
                planList.innerHTML = getPlanBenefits(client.plan).map(b =>
                    `<li class="flex items-start"><i class="fas fa-check text-green-500 mr-2 mt-1"></i><span>${b}</span></li>`
                ).join('');
            }

            // Handle Form Submit
            const photoForm = document.getElementById('photoForm');
            if (photoForm) {
                photoForm.onsubmit = async (e) => {
                    e.preventDefault();
                    const submitBtn = photoForm.querySelector('button[type="submit"]');
                    const originalText = submitBtn.innerText;
                    submitBtn.disabled = true;
                    submitBtn.innerText = 'Salvando...';

                    try {
                        const token = localStorage.getItem('token');

                        // 1. Update Profile Data (Email, Phone, Password)
                        const email = document.getElementById('myDataEmail').value;
                        const phone = document.getElementById('myDataPhone').value;
                        const password = document.getElementById('myDataPassword').value;

                        const updateRes = await authenticatedFetch(`${API_URL}/portal/me`, {
                            method: 'PUT',
                            body: JSON.stringify({ email, phone, password })
                        });

                        if (!updateRes.ok) {
                            throw new Error('Erro ao atualizar dados de perfil.');
                        }

                        // 2. Upload Photo (if selected) or Update Show Photo
                        const fileInput = document.getElementById('photoInput');
                        const showPhotoChecked = chk.checked;

                        // We always send the photo request if file exists OR to update show_photo flag
                        // But existing /uploads/photo endpoint expects FormData. 
                        // Let's assume it handles "just show_photo" update if no file provided?
                        // Checking backend code (not visible here), but usually it's better to try.
                        // If logic is strictly file-based, we might need to adjust.
                        // For now, let's try sending FormData.

                        const formData = new FormData();
                        if (fileInput.files[0]) {
                            formData.append('photo', fileInput.files[0]);
                        }
                        formData.append('showPhoto', showPhotoChecked);

                        const uploadRes = await fetch(`${API_URL}/uploads/photo`, {
                            method: 'POST',
                            headers: { 'x-access-token': token },
                            body: formData
                        });

                        if (!uploadRes.ok) throw new Error('Erro ao atualizar foto/preferências.');

                        alert('Dados atualizados com sucesso!');
                        // Reload to refresh data/images
                        window.location.reload();

                    } catch (err) {
                        console.error(err);
                        alert(err.message || 'Erro ao processar atualização.');
                    } finally {
                        submitBtn.disabled = false;
                        submitBtn.innerText = originalText;
                    }
                };
            }
        }
    } catch (err) { console.error(err); }
}

async function loadClientPortal() {
    try {
        const res = await authenticatedFetch(`${API_URL}/portal/me`);
        if (res.ok) {
            const client = await res.json();

            // Render specific client view into Home Section
            const homeSection = document.getElementById('sectionClientHome');
            if (!homeSection) return;

            const showPhoto = client.show_photo === 1 && client.photo_url;

            homeSection.innerHTML = `
                <div class="max-w-4xl mx-auto">
                    <h2 class="text-2xl font-bold mb-6 text-gray-800">Bem-vindo, ${client.name}</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
                            <h3 class="text-lg font-medium text-gray-900 mb-4">Sua Carteirinha Digital</h3>
                             <!-- Card Template Responsive -->
                            <!-- Aspect Ratio ~1.58 (CR80 scale) -->
                            <div id="idCardElement" class="card-gradient rounded-xl shadow-2xl p-6 text-white w-full aspect-[1.58/1] flex flex-col justify-between relative overflow-hidden mb-6">
                                <!-- Top Row: Logo & Badge -->
                                <div class="flex justify-between items-start">
                                    <div class="flex flex-col">
                                        <img src="img/logo-white.png" alt="Clube v3" class="h-6 sm:h-8 w-auto">
                                    </div>
                                    <div class="plan-badge">
                                        PLANO ${client.plan.toUpperCase()}
                                    </div>
                                </div>

                                <!-- Info Rows -->
                                <div class="flex flex-col gap-2 sm:gap-3">
                                    <!-- Card Number -->
                                    <div>
                                        <p class="card-label">Número do Cartão</p>
                                        <p class="card-value text-lg sm:text-xl tracking-[0.15em]">${generateCardNumber(client.cpf)}</p>
                                    </div>

                                    <!-- Beneficiary -->
                                    <div>
                                        <p class="card-label">Beneficiário</p>
                                        <p class="card-value text-sm sm:text-lg truncate">${client.name}</p>
                                    </div>

                                    <!-- Row 3: Plan & Validity -->
                                    <div class="flex gap-4 sm:gap-10">
                                        <div>
                                            <p class="card-label">Plano</p>
                                            <p class="card-value text-xs sm:text-md">${client.plan}</p>
                                        </div>
                                        <div>
                                            <p class="card-label">Validade</p>
                                            <p class="card-value text-xs sm:text-md">${formatDate(client.next_due_date)}</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- QR Code (Bottom Right) -->
                                <div class="absolute bottom-4 right-4 sm:bottom-6 sm:right-6">
                                    <div class="bg-white p-1 rounded-lg">
                                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${client.cpf}" alt="QR Code" class="w-12 h-12 sm:w-16 sm:h-16">
                                    </div>
                                </div>
                            </div>
                            <button onclick="printCard()" class="bg-accent-500 hover:bg-accent-600 text-white px-6 py-2 rounded-full font-bold shadow transition hover:scale-105 w-full">
                                <i class="fas fa-download mr-2"></i> Baixar PDF
                            </button>
                        </div>
                        <div class="bg-white p-6 rounded-lg shadow-lg">
                            <h3 class="text-lg font-medium text-gray-900 mb-4">Informações da Assinatura</h3>
                            <div class="space-y-4">
                                <div class="flex justify-between border-b pb-2"><span class="text-gray-600">Status</span><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(client.status)}">${client.status}</span></div>
                                <div class="flex justify-between border-b pb-2"><span class="text-gray-600">Próximo Vencimento</span><span class="font-medium text-gray-800">${formatDate(client.next_due_date)}</span></div>
                                <div class="flex justify-between border-b pb-2"><span class="text-gray-600">Valor Mensal</span><span class="font-medium text-gray-800">${formatCurrency(client.value)}</span></div>
                                <div class="mt-6 p-4 bg-brand-50 rounded-md"><p class="text-sm text-brand-700">Mantenha sua mensalidade em dia para garantir acesso ao clube e benefícios exclusivos.</p></div>
                            </div>
                        </div>
                    </div>
                </div>`;
        }
    } catch (err) { console.error(err); alert('Erro ao carregar portal.'); }
}

// ... existing helpers ...
async function loadEmployees() {
    try {
        const res = await authenticatedFetch(`${API_URL}/users`);
        if (res.ok) {
            const users = await res.json();
            const tbody = document.getElementById('employeeTableBody');
            if (tbody) {
                tbody.innerHTML = '';
                users.forEach(user => {
                    const row = `
                        <tr class="hover:bg-gray-50/80 transition-colors duration-200">
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.name}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email}</td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}">${user.role}</span>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(user.created_at)}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button onclick="deleteUser(${user.id})" title="Excluir" class="text-red-600 hover:text-red-900"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>`;
                    tbody.innerHTML += row;
                });
            }
        }
    } catch (err) { console.error(err); }
}

async function loadStats() {
    try {
        const res = await authenticatedFetch(`${API_URL}/dashboard/stats`);
        if (res.ok) {
            const data = await res.json();
            const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
            setTxt('statActive', data.counts.ativo || 0);
            setTxt('statPending', data.counts.pendente || 0);
            setTxt('statCancelled', data.counts.cancelado || 0);
            setTxt('statRevenue', formatCurrency(data.revenue || 0));
        }
    } catch (err) { console.error(err); }
}

async function loadClients() {
    try {
        const res = await authenticatedFetch(`${API_URL}/clients`);
        if (res.ok) {
            const clients = await res.json();
            const tbody = document.getElementById('clientTableBody');
            if (tbody) {
                tbody.innerHTML = '';
                const userStr = localStorage.getItem('user');
                let isAdmin = false;
                if (userStr) {
                    try {
                        const user = JSON.parse(userStr);
                        isAdmin = user.role === 'admin';
                    } catch (e) { }
                }

                clients.forEach(client => {
                    const statusColor = getStatusColor(client.status);

                    const deleteBtnHtml = isAdmin ?
                        `<button onclick="deleteClient(${client.id})" title="Excluir" class="text-red-600 hover:text-red-900"><i class="fas fa-trash"></i></button>` : '';

                    const row = `
                        <tr class="hover:bg-gray-50/80 transition-colors duration-200">
                            <td class="px-6 py-4 whitespace-nowrap"><div class="text-sm font-medium text-gray-900">${client.name}</div><div class="text-sm text-gray-500">${client.phone || '-'}</div></td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${client.email || '-'}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${client.cpf}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${client.plan}</td>
                            <td class="px-6 py-4 whitespace-nowrap"><span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}">${client.status}</span></td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(client.created_at)}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(client.start_date)}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(client.next_due_date)}</td>
                            <td class="px-6 py-4 whitespace-nowrap text-center">
                                <div class="inline-flex items-center space-x-1 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                                    <span class="text-sm font-bold text-gray-700">${client.payments_count || 1}</span>
                                    <span class="text-gray-400">/</span>
                                    <i class="fas fa-infinity text-[10px] text-brand-500"></i>
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                <button onclick="confirmPayment(${client.client_id || client.id})" title="Renovar" class="text-green-600 hover:text-green-900"><i class="fas fa-check-circle"></i></button>
                                <button onclick="openCardModal('${client.name}', '${client.cpf}', '${client.plan}', '${formatDate(client.next_due_date)}')" title="Carteirinha" class="text-blue-600 hover:text-blue-900"><i class="fas fa-id-card"></i></button>
                                <button onclick="openEditClientModal(${client.id}, '${client.name}', '${client.cpf}', '${client.phone || ''}', '${client.plan}', '${client.status}', '${client.next_due_date}')" title="Editar" class="text-yellow-600 hover:text-yellow-900"><i class="fas fa-edit"></i></button>
                                ${deleteBtnHtml}
                            </td>
                        </tr>`;
                    tbody.innerHTML += row;
                });
            }
        }
    } catch (err) { console.error(err); }
}

function openEditClientModal(id, name, cpf, phone, plan, status, nextDue) {
    document.getElementById('editClientId').value = id;
    document.getElementById('editName').value = name;
    document.getElementById('editCpf').value = cpf;
    document.getElementById('editPhone').value = phone;
    document.getElementById('editPlan').value = plan;
    document.getElementById('editStatus').value = status;
    document.getElementById('editNextDue').value = nextDue ? nextDue.split('T')[0] : '';
    window.openModal('editClientModal');
}

async function confirmPayment(id) {
    if (!id) return;
    if (!confirm('Confirmar pagamento e renovar por 30 dias?')) return;
    try {
        const res = await authenticatedFetch(`${API_URL}/clients/${id}/pay`, { method: 'POST' });
        if (res.ok) {
            alert('Pagamento confirmado!');
            loadClients();
            loadStats();
        } else {
            const data = await res.json();
            alert(data.message || 'Erro ao confirmar pagamento');
        }
    } catch (err) { console.error(err); alert('Erro de conexão'); }
}

function openCardModal(name, cpf, plan, expiry) {
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    setTxt('cardName', name);
    // setTxt('cardCpf', cpf); // Not in new design, but could be QR code source
    setTxt('cardPlan', plan);
    setTxt('cardExpiry', expiry);

    const numEl = document.getElementById('cardNumber');
    if (numEl) numEl.innerText = generateCardNumber(cpf);

    const qrEl = document.getElementById('cardQrCode');
    if (qrEl) qrEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${cpf}`;

    const badgeEl = document.getElementById('cardPlanBadge');
    if (badgeEl) {
        const planName = plan.toUpperCase();
        badgeEl.innerText = `PLANO ${planName}`;
    }
    window.openModal('idCardModal');
}

function generateCardNumber(cpf) {
    if (!cpf) return "0000 0000 0000 0000";
    // Simple deterministic number based on CPF digits
    const digits = cpf.replace(/\D/g, '');
    const padded = (digits + "0000000000000000").substring(0, 16);
    return padded.match(/.{1,4}/g).join(' ');
}

function printCard() {
    const element = document.getElementById('idCardElement');
    const opt = {
        margin: 0,
        filename: `carteirinha.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'px', format: [500, 300], orientation: 'landscape' }
    };
    if (typeof html2pdf === 'undefined') {
        alert('Biblioteca PDF carregando... Tente novamente em instantes.');
        return;
    }
    html2pdf().set(opt).from(element).save();
}

function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) window.location.href = 'index.html';
}

function setupUserHeader() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            const nameEl = document.getElementById('userName');
            if (nameEl && user.name) nameEl.innerText = user.name;
            const roleEl = document.getElementById('userRole');
            if (roleEl && user.role) {
                roleEl.innerText = user.role.toUpperCase();
                if (user.role === 'cliente') roleEl.className = 'px-2 py-1 text-xs font-bold text-white bg-accent-500 rounded-full';
                else if (user.role === 'admin') roleEl.className = 'px-2 py-1 text-xs font-bold text-white bg-brand-500 rounded-full';
                else roleEl.className = 'px-2 py-1 text-xs font-bold text-gray-800 bg-gray-200 rounded-full';
            }
        } catch (e) { console.error('Error parsing user header', e); }
    }
}

async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        'x-access-token': token,
        ...(options.headers || {})
    };
    return fetch(url, { ...options, headers });
}

function getStatusColor(status) {
    switch (status) {
        case 'ativo': return 'bg-green-100 text-green-800';
        case 'pendente': return 'bg-yellow-100 text-yellow-800';
        case 'cancelado': return 'bg-red-100 text-red-800';
        case 'lead_inativo': return 'bg-gray-100 text-gray-500';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function formatDate(dateString) {
    if (!dateString) return '-';
    // Converte a string (mesmo que com timezone .000Z) para Date object no local do usuário
    const dateObj = new Date(dateString);
    if (isNaN(dateObj)) return '-'; // Fallback se falhar

    // Retorna Dia, Mês e Ano garantido e zero-padded
    const day = String(dateObj.getUTCDate()).padStart(2, '0');
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const year = dateObj.getUTCFullYear();

    return `${day}/${month}/${year}`;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// --- Admin Actions ---

async function deleteUser(id) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
        const res = await authenticatedFetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadEmployees();
            alert('Usuário excluído!');
        } else {
            alert('Erro ao excluir.');
        }
    } catch (err) { console.error(err); }
}

async function deleteClient(id) {
    if (!confirm('Tem certeza que deseja excluir este cliente e seu usuário de acesso?')) return;
    try {
        const res = await authenticatedFetch(`${API_URL}/clients/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadClients();
            loadStats();
            alert('Cliente excluído!');
        } else {
            alert('Erro ao excluir.');
        }
    } catch (err) { console.error(err); }
}

function setupForcePasswordForm() {
    const form = document.getElementById('forcePasswordForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('newForcePassword').value;
        const confirmPassword = document.getElementById('confirmForcePassword').value;

        if (newPassword !== confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }

        if (newPassword.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerText = 'Salvando...';

        try {
            const res = await authenticatedFetch(`${API_URL}/portal/me`, {
                method: 'PUT',
                body: JSON.stringify({ password: newPassword })
            });

            if (res.ok) {
                alert('Senha atualizada com sucesso!');
                // Remove the flag locally so we can hide modal and proceed
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const userObj = JSON.parse(userStr);
                    userObj.force_password_change = 0;
                    localStorage.setItem('user', JSON.stringify(userObj));
                }
                document.getElementById('forcePasswordModal').classList.add('hidden');
            } else {
                const data = await res.json();
                alert(data.message || 'Erro ao redefinir a senha');
            }
        } catch (err) {
            console.error(err);
            alert('Erro de conexão');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = 'Salvar Nova Senha';
        }
    });
}

// --- Reports Logic ---
let charts = {};

async function loadReports() {
    try {
        const [resReports, resStats] = await Promise.all([
            authenticatedFetch(`${API_URL}/dashboard/reports`),
            authenticatedFetch(`${API_URL}/dashboard/stats`)
        ]);

        let statsData = {};
        if (resStats.ok) {
            statsData = await resStats.json();
            document.getElementById('reportMrr').innerText = formatCurrency(statsData.revenue || 0);
            document.getElementById('reportActive').innerText = statsData.counts['ativo'] || 0;
            document.getElementById('reportPending').innerText = statsData.counts['pendente'] || 0;
            document.getElementById('reportCanceled').innerText = statsData.counts['cancelado'] || 0;
        }

        if (resReports.ok) {
            const data = await resReports.json();

            if (data.growth && data.growth.length > 0) {
                document.getElementById('reportNew').innerText = data.growth[data.growth.length - 1].new_clients;
            }

            // Clean up old charts if they exist
            if (charts.growth) charts.growth.destroy();
            if (charts.plans) charts.plans.destroy();
            if (charts.status) charts.status.destroy();
            if (charts.mrr) charts.mrr.destroy();

            // Calculate approximate MRR evolution backwards
            let currentMrr = statsData.revenue || 0;
            let mrrHistory = [];
            let tempMrr = currentMrr;

            // data.growth is already reversed (chronological order)
            for (let i = data.growth.length - 1; i >= 0; i--) {
                mrrHistory.unshift(tempMrr); // add to beginning
                tempMrr = tempMrr - (data.growth[i].new_revenue || 0);
                if (tempMrr < 0) tempMrr = 0; // Prevent negative MRR in approx
            }

            // Font configurations for elegant look
            Chart.defaults.font.family = "'Inter', 'Segoe UI', sans-serif";
            Chart.defaults.color = '#64748b';

            // 1. Growth Chart (Line & Bar)
            const ctxGrowth = document.getElementById('growthChart')?.getContext('2d');
            if (ctxGrowth) {
                charts.growth = new Chart(ctxGrowth, {
                    type: 'line',
                    data: {
                        labels: data.growth.map(d => {
                            const [year, month] = d.month.split('-');
                            return `${month}/${year}`;
                        }),
                        datasets: [
                            {
                                label: 'Receita Novos (R$)',
                                data: data.growth.map(d => d.new_revenue),
                                borderColor: '#3bdbc0', // Cyan brand
                                backgroundColor: 'rgba(59, 219, 192, 0.1)',
                                borderWidth: 2,
                                yAxisID: 'y',
                                fill: true,
                                tension: 0.3,
                                pointBackgroundColor: '#fff',
                                pointBorderColor: '#3bdbc0',
                                pointBorderWidth: 2,
                                pointRadius: 4,
                                pointHoverRadius: 6
                            },
                            {
                                type: 'bar',
                                label: 'Novos Contratos',
                                data: data.growth.map(d => d.new_clients),
                                backgroundColor: 'rgba(47, 118, 125, 0.8)', // Dark brand green
                                borderRadius: 4,
                                barPercentage: 0.6,
                                yAxisID: 'y1'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: { usePointStyle: true, boxWidth: 8, font: { weight: '600' } }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                titleFont: { size: 13 },
                                bodyFont: { size: 13 },
                                padding: 12,
                                cornerRadius: 8,
                                displayColors: true
                            }
                        },
                        scales: {
                            x: {
                                grid: { display: false }
                            },
                            y: {
                                type: 'linear', display: true, position: 'left',
                                grid: { color: '#f1f5f9', drawBorder: false },
                                ticks: { callback: function (value) { return 'R$ ' + value; } }
                            },
                            y1: {
                                type: 'linear', display: true, position: 'right',
                                grid: { drawOnChartArea: false },
                                ticks: { precision: 0 }
                            }
                        }
                    }
                });
            }

            // 1.5. MRR Evolution Chart (Line)
            const ctxMrr = document.getElementById('mrrChart')?.getContext('2d');
            if (ctxMrr) {
                charts.mrr = new Chart(ctxMrr, {
                    type: 'line',
                    data: {
                        labels: data.growth.map(d => {
                            const [year, month] = d.month.split('-');
                            return `${month}/${year}`;
                        }),
                        datasets: [
                            {
                                label: 'Receita Total Mensal (R$)',
                                data: mrrHistory,
                                borderColor: '#2f767d', // Deep brand color
                                backgroundColor: 'rgba(47, 118, 125, 0.1)',
                                borderWidth: 3,
                                yAxisID: 'y',
                                fill: true,
                                tension: 0.4,
                                pointBackgroundColor: '#fff',
                                pointBorderColor: '#2f767d',
                                pointBorderWidth: 2,
                                pointRadius: 4,
                                pointHoverRadius: 6
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                            mode: 'index',
                            intersect: false,
                        },
                        plugins: {
                            legend: {
                                position: 'top',
                                labels: { usePointStyle: true, boxWidth: 8, font: { weight: '600' } }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                titleFont: { size: 13 },
                                bodyFont: { size: 13 },
                                padding: 12,
                                cornerRadius: 8,
                                displayColors: true
                            }
                        },
                        scales: {
                            x: {
                                grid: { display: false }
                            },
                            y: {
                                type: 'linear', display: true, position: 'left',
                                grid: { color: '#f1f5f9', drawBorder: false },
                                ticks: { callback: function (value) { return 'R$ ' + value; } }
                            }
                        }
                    }
                });
            }

            // 2. Plans Chart (Doughnut)
            const ctxPlans = document.getElementById('plansChart')?.getContext('2d');
            if (ctxPlans) {
                charts.plans = new Chart(ctxPlans, {
                    type: 'doughnut',
                    data: {
                        labels: data.plans.map(d => d.plan),
                        datasets: [{
                            data: data.plans.map(d => d.count),
                            backgroundColor: ['#2f767d', '#3bdbc0', '#41a8ad', '#2db99f', '#6fc5cd'], // Brand palette
                            borderWidth: 2,
                            borderColor: '#ffffff',
                            hoverOffset: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '70%',
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: { usePointStyle: true, padding: 20, font: { size: 12 } }
                            },
                            tooltip: {
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                padding: 12,
                                cornerRadius: 8
                            }
                        }
                    }
                });
            }

            // 3. Status Chart (Bar)
            const ctxStatus = document.getElementById('statusChart')?.getContext('2d');
            if (ctxStatus) {
                const statusColors = {
                    'ativo': '#22c55e', // Semiotic green
                    'pendente': '#eab308', // Semiotic yellow
                    'cancelado': '#ef4444', // Semiotic red
                    'lead_inativo': '#9ca3af' // Semiotic gray
                };

                charts.status = new Chart(ctxStatus, {
                    type: 'bar',
                    data: {
                        labels: data.status.map(d => d.status.toUpperCase()),
                        datasets: [{
                            label: 'Assinaturas',
                            data: data.status.map(d => d.count),
                            backgroundColor: data.status.map(d => statusColors[d.status] || '#cbd5e1'),
                            borderRadius: 6,
                            barPercentage: 0.5
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                padding: 12,
                                cornerRadius: 8
                            }
                        },
                        scales: {
                            x: { grid: { display: false } },
                            y: {
                                grid: { color: '#f1f5f9', drawBorder: false },
                                ticks: { precision: 0 }
                            }
                        }
                    }
                });
            }
        }
    } catch (err) {
        console.error('Erros ao buscar relatórios', err);
    }
}

// PDF Export Function for Reports
function exportReportsPDF() {
    const element = document.getElementById('sectionReports');
    const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `Relatorio-Clube-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: 'css', before: '.pdf-page-break' }
    };

    // Hide export button
    const exportBtn = element.querySelector('button');
    if (exportBtn) exportBtn.style.display = 'none';

    // Make layout 1 column for PDF so charts span full width
    const grids = element.querySelectorAll('.md\\:grid-cols-2');
    grids.forEach(g => {
        g.classList.remove('md:grid-cols-2');
        g.classList.add('md:grid-cols-1');
    });

    // Add page breaks before each chart card
    const chartCards = element.querySelectorAll('canvas');
    chartCards.forEach(canvas => {
        const card = canvas.closest('.bg-white.rounded-xl.shadow-lg');
        if (card) {
            card.classList.add('pdf-page-break');
            // Ensure minimum physical size for high quality render
            card.style.minHeight = '500px';
        }
    });

    html2pdf().set(opt).from(element).save().then(() => {
        // Restore original UI state
        if (exportBtn) exportBtn.style.display = 'flex';

        grids.forEach(g => {
            g.classList.add('md:grid-cols-2');
            g.classList.remove('md:grid-cols-1');
        });

        chartCards.forEach(canvas => {
            const card = canvas.closest('.bg-white.rounded-xl.shadow-lg');
            if (card) {
                card.classList.remove('pdf-page-break');
                card.style.minHeight = ''; // reset height
            }
        });
    });
}
