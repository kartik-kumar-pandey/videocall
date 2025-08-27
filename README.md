# VidFlow Pro 🎥✨

Professional video calling application with beautiful UI and robust WebRTC implementation.

## ✨ Features

- **Beautiful UI**: Glass morphism design with animated gradients
- **Group Video Calls**: Support for unlimited participants
- **Cross-Platform**: Works on all devices and browsers
- **Real-time**: WebSocket-based signaling server
- **Responsive**: Adaptive grid layout for any number of participants

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd vidflow-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the signaling server**
   ```bash
   npm run server
   ```

4. **Start the frontend**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## 🌐 Deployment

### Frontend (Vercel)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy to Vercel"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set environment variable:
     - `NEXT_PUBLIC_SIGNALING_SERVER`: Your Render backend URL

3. **Deploy**
   - Vercel will automatically deploy on every push
   - Your app will be available at `https://your-app.vercel.app`

### Backend (Render)

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Deploy Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `vidflow-pro-signaling`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`
     - **Plan**: Free

3. **Environment Variables**
   - `NODE_ENV`: `production`
   - `PORT`: `10000`

4. **Deploy**
   - Render will build and deploy automatically
   - Your backend will be available at `https://your-service.onrender.com`

## 🔧 Configuration

### Environment Variables

**Frontend (.env.local)**
```bash
NEXT_PUBLIC_SIGNALING_SERVER=https://your-backend.onrender.com
```

**Backend**
```bash
NODE_ENV=production
PORT=10000
```

### CORS Configuration

The backend is configured to accept connections from any origin. For production, you may want to restrict this to your Vercel domain.

## 📱 Usage

1. **Join a Room**
   - Enter your name
   - Create or join an existing room
   - Allow camera and microphone access

2. **Invite Others**
   - Share the room ID with participants
   - They can join using the same room ID

3. **Controls**
   - 🎤 Toggle microphone
   - 📷 Toggle camera
   - 📞 Leave call

## 🏗️ Architecture

- **Frontend**: Next.js with Tailwind CSS
- **Backend**: Express.js with Socket.IO
- **WebRTC**: Peer-to-peer video streaming
- **Signaling**: WebSocket-based coordination

## 🐛 Troubleshooting

### Common Issues

1. **Camera/Microphone not working**
   - Check browser permissions
   - Ensure HTTPS in production
   - Try refreshing the page

2. **Connection issues**
   - Verify backend is running
   - Check firewall settings
   - Ensure WebRTC is supported

3. **Video quality issues**
   - Check internet connection
   - Reduce participant count
   - Verify device capabilities

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues and questions:
- Create a GitHub issue
- Check the troubleshooting section
- Review the documentation

---

**VidFlow Pro** - Professional video calls that flow seamlessly 🎥✨
