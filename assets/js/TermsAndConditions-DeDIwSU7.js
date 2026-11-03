import{j as e,m as v}from"./animation-Desx1sqp.js";import{i as x,u,a as n,L as h}from"./vendor-C4HdNN9j.js";import{u as y,i as k,M as w}from"./index-BXefAUGh.js";import{A as j}from"./arrow-left-DH5IP4eQ.js";import{S as d}from"./shield-Dg81Y23i.js";import{F as p}from"./file-text-7HaKOzwe.js";import{U as P}from"./users-0GR7Mii2.js";const M=()=>{const{theme:i}=y(),o=x(),a=u(),[t,g]=n.useState("overview"),[m,r]=n.useState("/");n.useEffect(()=>{const s=sessionStorage.getItem("lastVisitedPage");if(a.state?.from)r(a.state.from);else if(s&&s!==a.pathname)r(s);else{const l=document.referrer.includes("/collaborate")||s==="/collaborate";r(l?"/collaborate":"/")}sessionStorage.setItem("lastVisitedPage",a.pathname)},[a.state,a.pathname]);const f=()=>{window.history.length>1?o(-1):o(m)},b=[{id:"overview",title:"Overview",icon:p},{id:"services",title:"Services",icon:P},{id:"responsibilities",title:"Responsibilities",icon:d},{id:"payment",title:"Payment Terms",icon:p},{id:"confidentiality",title:"Confidentiality",icon:d},{id:"termination",title:"Termination",icon:k},{id:"contact",title:"Contact",icon:w}],c={overview:{title:"Overview",content:`
                <div class="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-lg">
                    <div class="flex items-center gap-2 mb-2">
                        <i class="fas fa-info-circle text-blue-500"></i>
                        <strong class="text-blue-700 dark:text-blue-300">Important Notice</strong>
                    </div>
                    <p class="text-blue-700 dark:text-blue-300">These terms govern our professional relationship and protect both parties' interests.</p>
                </div>
                
                <p class="mb-4">These Terms and Conditions govern the collaboration between you ("the Collaborator") and us ("the Service Provider") for web development, design, and related services.</p>
                <p class="mb-4">By submitting a collaboration request or engaging in our services, you agree to be bound by these terms and conditions.</p>
                
                <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-check-circle text-green-500"></i>
                        1. Acceptance of Terms
                    </h3>
                    <p class="mb-4">Your use of our services constitutes your acceptance of these terms and conditions in their entirety.</p>
                </div>
                
                <div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-calendar-alt text-orange-500"></i>
                        2. Modifications
                    </h3>
                    <p class="mb-4">We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting.</p>
                </div>
            `},services:{title:"Services",content:`
                <div class="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg mb-6">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-briefcase text-purple-600 dark:text-purple-400"></i>
                        Scope of Services
                    </h3>
                    <p class="mb-4">Our comprehensive services include:</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="flex items-center gap-2">
                            <i class="fas fa-code text-blue-500"></i>
                            <span>Web development and design</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="fas fa-laptop-code text-green-500"></i>
                            <span>Frontend and backend development</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="fas fa-palette text-pink-500"></i>
                            <span>UI/UX design services</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="fas fa-mobile-alt text-orange-500"></i>
                            <span>Mobile application development</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="fas fa-database text-indigo-500"></i>
                            <span>Database design and implementation</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="fas fa-plug text-teal-500"></i>
                            <span>API development and integration</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <i class="fas fa-handshake text-purple-500"></i>
                            <span>Consulting and technical support</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-award text-green-600 dark:text-green-400"></i>
                        Service Standards
                    </h3>
                    <p class="mb-4">We commit to delivering high-quality services that meet industry standards and your specific requirements.</p>
                    <ul class="list-disc list-inside space-y-2">
                        <li>Professional code quality and documentation</li>
                        <li>Timely delivery and communication</li>
                        <li>Industry best practices and standards</li>
                        <li>Post-launch support and maintenance</li>
                    </ul>
                </div>
            `},responsibilities:{title:"Responsibilities",content:`
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                            <i class="fas fa-user text-blue-600 dark:text-blue-400"></i>
                            Collaborator Responsibilities
                        </h3>
                        <p class="mb-4">As a collaborator, you agree to:</p>
                        <ul class="space-y-2">
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-green-500 mt-1"></i>
                                <span>Provide accurate and complete information</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-green-500 mt-1"></i>
                                <span>Respond promptly to communications</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-green-500 mt-1"></i>
                                <span>Meet agreed-upon deadlines</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-green-500 mt-1"></i>
                                <span>Maintain professional conduct</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-green-500 mt-1"></i>
                                <span>Respect confidentiality agreements</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-green-500 mt-1"></i>
                                <span>Provide necessary materials and feedback</span>
                            </div>
                        </ul>
                    </div>
                    
                    <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                            <i class="fas fa-building text-green-600 dark:text-green-400"></i>
                            Service Provider Responsibilities
                        </h3>
                        <p class="mb-4">We commit to:</p>
                        <ul class="space-y-2">
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-blue-500 mt-1"></i>
                                <span>Deliver services as agreed</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-blue-500 mt-1"></i>
                                <span>Maintain open communication</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-blue-500 mt-1"></i>
                                <span>Provide regular progress updates</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-blue-500 mt-1"></i>
                                <span>Address concerns promptly</span>
                            </div>
                            <div class="flex items-start gap-2">
                                <i class="fas fa-check text-blue-500 mt-1"></i>
                                <span>Maintain professional standards</span>
                            </div>
                        </ul>
                    </div>
                </div>
            `},payment:{title:"Payment Terms",content:`
                <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg mb-6">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-dollar-sign text-yellow-600 dark:text-yellow-400"></i>
                        Payment Structure
                    </h3>
                    <p class="mb-4">Flexible payment options to suit your project needs:</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <h4 class="font-semibold mb-2">Fixed Project Fees</h4>
                            <p class="text-sm">One-time payment for completed projects</p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <h4 class="font-semibold mb-2">Hourly Rates</h4>
                            <p class="text-sm">Pay for actual time spent on development</p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <h4 class="font-semibold mb-2">Milestone Payments</h4>
                            <p class="text-sm">Pay as project milestones are completed</p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <h4 class="font-semibold mb-2">Retainer Agreements</h4>
                            <p class="text-sm">Ongoing monthly support and maintenance</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg mb-4">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-clock text-orange-600 dark:text-orange-400"></i>
                        Payment Schedule
                    </h3>
                    <p class="mb-4">Payments are typically due within 15-30 days of invoice, depending on the agreement terms.</p>
                </div>
                
                <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-exclamation-triangle text-red-600 dark:text-red-400"></i>
                        Late Payments
                    </h3>
                    <p class="mb-4">Late payments may incur interest charges as permitted by applicable law.</p>
                </div>
            `},confidentiality:{title:"Confidentiality",content:`
                <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg mb-6">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-lock text-purple-600 dark:text-purple-400"></i>
                        Confidential Information
                    </h3>
                    <p class="mb-4">Both parties agree to maintain confidentiality of:</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-briefcase text-purple-500"></i>
                            <span>Business strategies and plans</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-code text-purple-500"></i>
                            <span>Technical specifications and code</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-users text-purple-500"></i>
                            <span>Client information</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-chart-line text-purple-500"></i>
                            <span>Financial information</span>
                        </div>
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded">
                            <i class="fas fa-shield-alt text-purple-500"></i>
                            <span>Trade secrets and proprietary information</span>
                        </div>
                    </div>
                </div>
                
                <div class="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-hourglass-half text-indigo-600 dark:text-indigo-400"></i>
                        Duration
                    </h3>
                    <p class="mb-4">Confidentiality obligations survive the termination of the collaboration agreement.</p>
                </div>
            `},termination:{title:"Termination",content:`
                <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-6">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-times-circle text-red-600 dark:text-red-400"></i>
                        Termination by Either Party
                    </h3>
                    <p class="mb-4">Either party may terminate the collaboration with:</p>
                    <div class="space-y-3">
                        <div class="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded">
                            <i class="fas fa-calendar text-blue-500"></i>
                            <div>
                                <strong>30 days written notice</strong> for convenience
                            </div>
                        </div>
                        <div class="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded">
                            <i class="fas fa-ban text-red-500"></i>
                            <div>
                                <strong>Immediate notice</strong> for material breach
                            </div>
                        </div>
                        <div class="flex items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded">
                            <i class="fas fa-handshake text-green-500"></i>
                            <div>
                                <strong>Mutual agreement</strong> between parties
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-tasks text-orange-600 dark:text-orange-400"></i>
                        Obligations After Termination
                    </h3>
                    <p class="mb-4">Upon termination, parties must:</p>
                    <ul class="space-y-2">
                        <div class="flex items-start gap-2">
                            <i class="fas fa-undo text-orange-500 mt-1"></i>
                            <span>Return all confidential information</span>
                        </div>
                        <div class="flex items-start gap-2">
                            <i class="fas fa-money-bill text-orange-500 mt-1"></i>
                            <span>Complete payment for services rendered</span>
                        </div>
                        <div class="flex items-start gap-2">
                            <i class="fas fa-exchange-alt text-orange-500 mt-1"></i>
                            <span>Transfer deliverables as agreed</span>
                        </div>
                    </ul>
                </div>
            `},contact:{title:"Contact Information",content:`
                <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-6">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-envelope text-green-600 dark:text-green-400"></i>
                        General Inquiries
                    </h3>
                    <p class="mb-4">For questions about these terms and conditions, please contact us at:</p>
                    <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="flex items-center gap-3">
                                <i class="fas fa-envelope text-green-500"></i>
                                <div>
                                    <strong>Email:</strong> legal@example.com
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <i class="fas fa-phone text-green-500"></i>
                                <div>
                                    <strong>Phone:</strong> +1 (555) 123-4567
                                </div>
                            </div>
                            <div class="flex items-center gap-3 md:col-span-2">
                                <i class="fas fa-map-marker-alt text-green-500"></i>
                                <div>
                                    <strong>Address:</strong> 123 Business St, Suite 100, City, State 12345
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-headset text-blue-600 dark:text-blue-400"></i>
                        Support
                    </h3>
                    <p class="mb-4">For project-related support, please use your primary contact or project manager.</p>
                </div>
                
                <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h3 class="text-lg font-semibold mb-3 flex items-center gap-2">
                        <i class="fas fa-gavel text-purple-600 dark:text-purple-400"></i>
                        Legal Disputes
                    </h3>
                    <p class="mb-4">Any legal disputes will be governed by the laws of the jurisdiction specified in your project agreement.</p>
                </div>
            `}};return e.jsx("div",{className:`min-h-screen ${i==="dark"?"bg-gray-900 text-white":"bg-gray-50 text-gray-900"}`,children:e.jsxs("div",{className:"container mx-auto px-4 py-8",children:[e.jsxs("div",{className:"flex items-center justify-between mb-8",children:[e.jsxs("button",{onClick:f,className:"flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors",children:[e.jsx(j,{size:20}),"Back"]}),e.jsxs(h,{to:"/privacy",state:{from:a.pathname},className:"flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors",children:[e.jsx(d,{size:20}),"View Privacy Policy"]})]}),e.jsxs("div",{className:"grid grid-cols-1 lg:grid-cols-4 gap-8",children:[e.jsx("div",{className:"lg:col-span-1",children:e.jsxs("div",{className:"sticky top-8",children:[e.jsx("h2",{className:"text-xl font-bold mb-4",children:"Sections"}),e.jsx("nav",{className:"space-y-2",children:b.map(s=>{const l=s.icon;return e.jsxs("button",{onClick:()=>g(s.id),className:`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${t===s.id?"bg-blue-500 text-white":i==="dark"?"bg-gray-800 hover:bg-gray-700":"bg-white hover:bg-gray-100"}`,children:[e.jsx(l,{size:18}),s.title]},s.id)})})]})}),e.jsx("div",{className:"lg:col-span-3",children:e.jsxs(v.div,{initial:{opacity:0,y:20},animate:{opacity:1,y:0},transition:{duration:.3},className:`rounded-xl p-8 ${i==="dark"?"bg-gray-800":"bg-white"}`,children:[e.jsx("h1",{className:"text-3xl font-bold mb-6",children:c[t].title}),e.jsx("div",{className:"prose prose-lg max-w-none",dangerouslySetInnerHTML:{__html:c[t].content}})]},t)})]})]})})};export{M as default};
