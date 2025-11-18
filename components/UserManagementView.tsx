import React, { useState } from 'react';
// FIX: Corrected import paths
import type { User, NewUserData } from '../types';
import UserTable from './UserTable';
import AddUserModal from './AddUserModal';
import type { TranslationKey } from '../translations';

interface UserManagementViewProps {
    users: User[];
    currentUser: User;
    onAddUser: (userData: NewUserData) => void;
    onEditUser: (userId: string, userData: NewUserData) => void;
    onDeleteUser: (userId: string) => void;
    onResetPassword: (userId: string) => void;
    showAlert: (title: string, message: string) => void;
    t: (key: TranslationKey) => string;
}

const UserManagementView: React.FC<UserManagementViewProps> = ({ users, currentUser, onAddUser, onEditUser, onDeleteUser, onResetPassword, showAlert, t }) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleAddUser = (userData: NewUserData) => {
        onAddUser(userData);
        setIsAddModalOpen(false);
    };
    
    return (
        <>
            <div className="space-y-6">
                <UserTable
                    users={users}
                    currentUser={currentUser}
                    onAddUserClick={() => setIsAddModalOpen(true)}
                    onEditUser={onEditUser}
                    onDeleteUser={onDeleteUser}
                    onResetPassword={onResetPassword}
                    showAlert={showAlert}
                    t={t}
                />
            </div>
            <AddUserModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAddUser={handleAddUser}
                showAlert={showAlert}
                t={t}
            />
        </>
    );
};

export default UserManagementView;