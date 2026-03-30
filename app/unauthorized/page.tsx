'use client';


export const dynamic = 'force-dynamic';
// app/unauthorized/page.tsx
// 403 Forbidden - User doesn't have permission

import React from 'react';
import { Result, Button } from 'antd';
import { useRouter } from 'next/navigation';
import { LockOutlined } from '@ant-design/icons';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
      }}
    >
      <Result
        status="403"
        icon={<LockOutlined style={{ fontSize: 72, color: '#ff4d4f' }} />}
        title="403 - Access Denied"
        subTitle="Sorry, you don't have permission to access this page."
        extra={[
          <Button type="primary" key="dashboard" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>,
          <Button key="logout" onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push('/login');
          }}>
            Logout
          </Button>,
        ]}
      />
    </div>
  );
}
