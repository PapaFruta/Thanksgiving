<script setup lang = "ts">
import { ref } from 'vue';
import ChangePassword from "../components/Setting/ChangePassword.vue";
import ChangeUsername from '../components/Setting/ChangeUsername.vue';
import DeleteAccount from '../components/Setting/DeleteAccount.vue';
import LogOut from '../components/Setting/LogOut.vue';
import router from '../router';
import { useUserStore } from '../stores/user';

const {currentUsername, currentProfilePicture, updateSession} = useUserStore();
const isChangeUsernameOpen = ref(false);
const isChangePasswordOpen = ref(false);
const isDeleteAccountOpen = ref(false)
const isLogOutOpen = ref(false);

const goBack = () => {
  router.go(-1);
};

const showChangeUsername = () => {
  isChangeUsernameOpen.value = true;
};

const updateUsername = () => {
    updateSession();
    isChangeUsernameOpen.value = false;
}

const showChangePassword = () => {
  isChangePasswordOpen.value = true;
};

const updatePassword = () => {
    updateSession();
    isChangePasswordOpen.value = false;
}

const showDeleteAccount = () => {
  isDeleteAccountOpen.value = true;
};

const updateDeleteAccount = () => {
    updateSession();
    isDeleteAccountOpen.value = false;
}

const showLogOut = () => {
  isLogOutOpen.value = true;
};

const updateLogOut = () => {
    updateSession();
    isLogOutOpen.value = false;
}

</script>

<template>
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="header-container">
            <h1>Setting</h1>
            <button class = "back-btn" @click="goBack">Back</button>
        </div>
        <hr>
        <div class = "column">
            <button class = "setting-selection" @click="showChangeUsername">Change Username</button>
            <ChangeUsername :isOpen="isChangeUsernameOpen" :currentUsername="currentUsername" @close="updateUsername"/>
            <button class = "setting-selection"  @click="showChangePassword">Change Password</button>
            <ChangePassword :isOpen="isChangePasswordOpen" @close="updatePassword"/>
            <button  class = "setting-selection" @click="showDeleteAccount">Delete Account</button>
            <DeleteAccount :isOpen="isDeleteAccountOpen" @close = "updateDeleteAccount" />
            <button  class = "setting-selection" @click="showLogOut">Logout</button>
            <LogOut :isOpen="isLogOutOpen" @close = "updateLogOut" />
        </div>
        
      </div>
    </div>
    
</template>

<style scoped>
.header-container {
  display: flex;
  align-items: center; /* Vertically align items in the middle */
  justify-content: space-between; /* Space items out between their container */
  width: 100%; /* Take full width of its parent */
}
.back-btn{
    background-color: transparent;
    border: none;
    color: var(--dark-purple);
    font-size: 2.5vh;
    padding: 1vh;
    font-weight: 600;
    padding-right: 5%;
    padding-left: 5%;
}


.back-btn:hover{
    background-color: var(--blue-gray);
    color: var(--deep-purple);
}

</style>