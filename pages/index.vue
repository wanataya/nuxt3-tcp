<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <header class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-200 mb-2">
          Nuxt 3 TCP Communication
        </h1>
        <p class="text-gray-400">
          Real-time communication between web client and TCP server
        </p>
      </header>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Connection Status -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold mb-4 text-gray-800">
            Connection Status
          </h2>
          
          <div class="space-y-3">
            <div class="flex items-center">
              <div :class="socketConnected ? 'bg-green-500' : 'bg-red-500'" 
                   class="w-3 h-3 rounded-full mr-3"></div>
              <span class="text-sm text-gray-500">
                Socket.IO Server: {{ socketConnected ? 'Connected' : 'Disconnected' }}
              </span>
            </div>
            
            <div class="flex items-center">
              <div :class="tcpConnected ? 'bg-green-500' : 'bg-red-500'" 
                   class="w-3 h-3 rounded-full mr-3"></div>
              <span class="text-sm text-gray-500">
                TCP Server: {{ tcpConnected ? 'Connected' : 'Disconnected' }}
              </span>
            </div>
            
            <div class="text-sm text-gray-800">
              TCP Clients Connected: {{ tcpClientCount }}
            </div>
          </div>
        </div>

        <!-- Send Message -->
        <div class="bg-white rounded-lg shadow-lg p-6">
          <h2 class="text-xl font-semibold mb-4 text-gray-800">
            Send Message to TCP Clients
          </h2>
          
          <form @submit.prevent="sendMessage" class="space-y-4">
            <div>
              <textarea 
                v-model="messageInput"
                placeholder="Type your message here..."
                class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800"
                rows="3"
                :disabled="!socketConnected"
              ></textarea>
            </div>
            
            <button 
              type="submit"
              :disabled="!socketConnected || !messageInput.trim()"
              class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>

      <!-- Messages -->
      <div class="mt-8 bg-white rounded-lg shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-4 text-gray-800">
          Messages
        </h2>
        
        <div class="message-container" ref="messagesContainer">
          <div v-if="messages.length === 0" class="text-center text-gray-500 py-8">
            No messages yet. Start the TCP server and send some messages!
          </div>
          
          <div v-for="message in messages" :key="message.id" 
               :class="getMessageClass(message.type)" 
               class="message-item">
            <div class="font-medium text-xs mb-1">
              {{ formatMessageType(message.type) }}
              <span class="text-gray-500 ml-2">{{ formatTime(message.timestamp) }}</span>
            </div>
            <div>{{ message.content }}</div>
          </div>
        </div>
        
        <div class="mt-4 flex justify-between items-center">
          <button 
            @click="clearMessages"
            class="text-red-600 hover:text-red-800 text-sm"
          >
            Clear Messages
          </button>
          
          <div class="text-sm text-gray-500">
            Total messages: {{ messages.length }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { io } from 'socket.io-client'

const config = useRuntimeConfig()

// Reactive state
const socket = ref(null)
const socketConnected = ref(false)
const tcpConnected = ref(false)
const tcpClientCount = ref(0)
const messageInput = ref('')
const messages = ref([])
const messagesContainer = ref(null)

// Initialize socket connection
onMounted(() => {
  initializeSocket()
})

onUnmounted(() => {
  if (socket.value) {
    socket.value.disconnect()
  }
})

function initializeSocket() {
  socket.value = io(`http://localhost:${config.public.socketPort}`)
  
  socket.value.on('connect', () => {
    socketConnected.value = true
    addSystemMessage('Connected to Socket.IO server')
  })
  
  socket.value.on('disconnect', () => {
    socketConnected.value = false
    addSystemMessage('Disconnected from Socket.IO server')
  })
  
  socket.value.on('tcp-status', (data) => {
    tcpConnected.value = data.connected
    tcpClientCount.value = data.clientCount || 0
  })
  
  socket.value.on('tcp-message', (data) => {
    addMessage({
      type: 'tcp-client',
      content: data.content,
      timestamp: data.timestamp
    })
  })
  
  socket.value.on('message-sent', (data) => {
    addMessage({
      type: 'web-client',
      content: data.content,
      timestamp: data.timestamp
    })
  })
  
  socket.value.on('error', (error) => {
    console.error('Socket error:', error)
    addSystemMessage('Socket error occurred')
  })
}

function sendMessage() {
  if (!messageInput.value.trim() || !socket.value) return
  
  socket.value.emit('send-to-tcp', {
    content: messageInput.value,
    timestamp: new Date().toISOString()
  })
  
  messageInput.value = ''
}

function addMessage(message) {
  messages.value.push({
    id: Date.now() + Math.random(),
    ...message
  })
  
  nextTick(() => {
    scrollToBottom()
  })
}

function addSystemMessage(content) {
  addMessage({
    type: 'system',
    content,
    timestamp: new Date().toISOString()
  })
}

function clearMessages() {
  messages.value = []
}

function getMessageClass(type) {
  switch (type) {
    case 'web-client':
      return 'message-web'
    case 'tcp-client':
      return 'message-tcp'
    case 'system':
      return 'message-system'
    default:
      return 'message-system'
  }
}

function formatMessageType(type) {
  switch (type) {
    case 'web-client':
      return 'Web Client'
    case 'tcp-client':
      return 'TCP Client'
    case 'system':
      return 'System'
    default:
      return 'Unknown'
  }
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString()
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}
</script>