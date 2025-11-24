import React, { createContext, useEffect } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext();

const socket = io(import.meta.env.VITE_BASE_URL, {
    transports: ['websocket', 'polling'],
    autoConnect: false,
    auth: {
        token: localStorage.getItem('token') || ""
    }
});

const SocketProvider = ({ children }) => {
    useEffect(() => {
        console.log('🔌 SocketProvider initializing...');
        console.log('   VITE_BASE_URL:', import.meta.env.VITE_BASE_URL);

        // Connect socket manually
        socket.connect();
        console.log('   socket.connect() called');

        socket.on('connect', () => {
            console.log('\n' + '='.repeat(80));
            console.log('✅ SOCKET CONNECTED');
            console.log('   Socket ID:', socket.id);
            console.log('   Connected to:', import.meta.env.VITE_BASE_URL);
            console.log('   Time:', new Date().toISOString());
            console.log('='.repeat(80));

            // Wait for localStorage to be ready
            setTimeout(() => {
                const userStr = localStorage.getItem('user');
                const captainStr = localStorage.getItem('captain');

                const user = userStr ? JSON.parse(userStr) : null;
                const captain = captainStr ? JSON.parse(captainStr) : null;

                console.log('\n📦 Checking localStorage:');
                console.log('   user:', user ? `Found (ID: ${user._id})` : '❌ Not found');
                console.log('   captain:', captain ? `Found (ID: ${captain._id})` : '❌ Not found');

                if (user) {
                    console.log('\n📤 Emitting JOIN for USER');
                    console.log('   User ID:', user._id);
                    socket.emit('join', {
                        userId: user._id,
                        userType: 'user'
                    });
                }

                if (captain) {
                    console.log('\n📤 Emitting JOIN for CAPTAIN');
                    console.log('   Captain ID:', captain._id);
                    socket.emit('join', {
                        userId: captain._id,
                        userType: 'captain'
                    });
                }

                if (!user && !captain) {
                    console.warn('\n⚠️ WARNING: No user or captain in localStorage');
                    console.warn('   User might not be logged in yet');
                }
            }, 200);
        });

        socket.on('disconnect', () => {
            console.log('\n❌ SOCKET DISCONNECTED');
            console.log('   Time:', new Date().toISOString());
        });

        socket.on('connect_error', (error) => {
            console.error('\n❌ SOCKET CONNECTION ERROR');
            console.error('   Message:', error.message);
            console.error('   Backend URL:', import.meta.env.VITE_BASE_URL);
            console.error('   Make sure backend server is running');
        });

        return () => {
            console.log('🔌 SocketProvider cleanup');
            socket.off('connect');
            socket.off('disconnect');
            socket.off('connect_error');
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketProvider;