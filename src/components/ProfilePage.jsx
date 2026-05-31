import { useEffect, useState } from "react";
import { db } from "../firebase";
import { updateDoc, doc } from "firebase/firestore";

function ProfilePage({ currentUser, setCurrentUser, onBack }) {
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || "",
    dept: currentUser?.dept || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileImagePreview, setProfileImagePreview] = useState(
    currentUser?.profileImage || currentUser?.photoURL || ""
  );

  useEffect(() => {
    setProfileForm({
      name: currentUser?.name || "",
      dept: currentUser?.dept || "",
    });
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setProfileImagePreview(
      currentUser?.profileImage || currentUser?.photoURL || ""
    );
  }, [currentUser]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setProfileImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    if (
      passwordForm.currentPassword ||
      passwordForm.newPassword ||
      passwordForm.confirmPassword
    ) {
      if (passwordForm.currentPassword !== currentUser.password) {
        return alert("Current password does not match.");
      }
      if (!passwordForm.newPassword) {
        return alert("Enter a new password.");
      }
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        return alert("Password confirmation does not match.");
      }
    }

    const updates = {
      name: profileForm.name,
      dept: profileForm.dept,
    };

    if (
      profileImagePreview &&
      profileImagePreview !== currentUser.profileImage &&
      profileImagePreview !== currentUser.photoURL
    ) {
      updates.profileImage = profileImagePreview;
    }

    if (passwordForm.newPassword) {
      updates.password = passwordForm.newPassword;
    }

    try {
      await updateDoc(doc(db, "users", currentUser.id), updates);
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      alert("Profile updated successfully.");
    } catch (error) {
      console.error(error);
      alert("Could not save profile changes.");
    }
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6 pb-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500 font-black">
            Profile Editor
          </p>
          <h1 className="text-3xl font-black text-slate-900">
            Edit Your Account
          </h1>
          <p className="mt-3 text-sm text-slate-500 max-w-2xl">
            Update your profile information, password, and avatar on a dedicated page.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-slate-700 transition hover:bg-slate-100"
        >
          Back to Dashboard
        </button>
      </div>

      <div className="overflow-hidden rounded-[36px] border border-slate-200 bg-slate-50 shadow-2xl">
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="relative overflow-hidden bg-slate-950 p-6">
            <div className="absolute -top-10 right-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl"></div>
            <div className="relative flex flex-col items-center gap-5 text-center">
              <div className="w-36 h-36 rounded-[28px] overflow-hidden border-4 border-emerald-400/20 bg-slate-800 shadow-xl">
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-slate-800 text-white text-4xl font-black">
                    {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.32em] text-emerald-300 font-black">
                  Your profile
                </p>
                <h2 className="text-3xl font-black tracking-tight text-white">
                  {currentUser?.name}
                </h2>
                <p className="text-sm text-slate-400 max-w-xs">
                  Manage your account, update your password, and keep your profile fresh.
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] uppercase tracking-[0.32em] text-slate-400 font-black">
                  Employee ID
                </p>
                <p className="mt-2 text-lg font-black text-white break-words">
                  {currentUser?.empId}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] uppercase tracking-[0.32em] text-slate-400 font-black">
                  Department
                </p>
                <p className="mt-2 text-lg font-black text-white">
                  {currentUser?.dept || "N/A"}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <p className="text-[10px] uppercase tracking-[0.32em] text-slate-400 font-black">
                  Profile status
                </p>
                <p className="mt-2 text-lg font-black text-emerald-300">Active</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 sm:p-8">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400 font-black">
                  Account settings
                </p>
                <h3 className="text-2xl font-black text-slate-900">Update profile</h3>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-200">
                <span>Change photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <form onSubmit={handleProfileSave} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-500 font-black">
                    Name
                  </label>
                  <input
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-500 font-black">
                    Department
                  </label>
                  <input
                    value={profileForm.dept}
                    onChange={(e) => setProfileForm({ ...profileForm, dept: e.target.value })}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                    placeholder="Department"
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-500 font-black">
                  Employee ID
                </label>
                <input
                  value={currentUser?.empId || ""}
                  disabled
                  className="w-full rounded-3xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500"
                />
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 font-black">
                      Change Password
                    </p>
                    <p className="text-sm text-slate-400">Update your login password securely.</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500 font-black">
                      Current
                    </label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                      placeholder="Current password"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500 font-black">
                      New
                    </label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                      placeholder="New password"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.18em] text-slate-500 font-black">
                      Confirm
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                      placeholder="Confirm password"
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-3xl bg-emerald-500 px-5 py-3 text-sm font-black uppercase tracking-[0.15em] text-slate-950 shadow-xl transition hover:bg-emerald-400"
              >
                Save Profile Changes
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
