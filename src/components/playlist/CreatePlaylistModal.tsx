import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Plus, Link, Sparkles } from 'lucide-react-native';
import { usePlaylistStore } from '../../store/playlistStore';
import { showToast } from '../Toast';
import { Playlist } from '../../types';

interface CreatePlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (playlist: Playlist) => void;
}

export const CreatePlaylistModal: React.FC<CreatePlaylistModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const [tab, setTab] = useState<'create' | 'import'>('create');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [importUrl, setImportUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const createPlaylist = usePlaylistStore((s) => s.createPlaylist);
  const importYouTubePlaylist = usePlaylistStore((s) => s.importYouTubePlaylist);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setImportUrl('');
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      showToast('Please enter a playlist title');
      return;
    }
    setIsLoading(true);
    try {
      const pl = await createPlaylist(title.trim(), description.trim());
      showToast(`Created "${pl.title}"`);
      resetForm();
      onClose();
      onSuccess?.(pl);
    } catch {
      showToast('Failed to create playlist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importUrl.trim()) {
      showToast('Please paste a YouTube playlist URL');
      return;
    }
    setIsLoading(true);
    try {
      const res = await importYouTubePlaylist(importUrl.trim());
      if (res.success && res.playlist) {
        showToast(`Imported "${res.playlist.title}" (${res.playlist.tracks.length} tracks)`);
        resetForm();
        onClose();
        onSuccess?.(res.playlist);
      } else {
        showToast(res.error || 'Could not import playlist');
      }
    } catch (err: any) {
      showToast(err?.message || 'Import error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-black/80 justify-center items-center px-5"
      >
        <View className="w-full max-w-sm bg-card border border-zinc-800 rounded-3xl p-6 shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-5">
            <Text className="text-white font-extrabold text-xl">New Playlist</Text>
            <TouchableOpacity
              onPress={handleClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="w-8 h-8 rounded-full bg-zinc-800/80 items-center justify-center"
            >
              <X size={18} color="#a1a1aa" />
            </TouchableOpacity>
          </View>

          {/* Liner Style Tabs: Create | Import */}
          <View className="flex-row bg-zinc-900 rounded-xl p-1 mb-5 border border-zinc-800">
            <TouchableOpacity
              onPress={() => setTab('create')}
              className={`flex-1 py-2 rounded-lg items-center ${
                tab === 'create' ? 'bg-zinc-800' : ''
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  tab === 'create' ? 'text-white' : 'text-zinc-400'
                }`}
              >
                Create
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setTab('import')}
              className={`flex-1 py-2 rounded-lg items-center ${
                tab === 'import' ? 'bg-zinc-800' : ''
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  tab === 'import' ? 'text-white' : 'text-zinc-400'
                }`}
              >
                Import
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {tab === 'create' ? (
            <View>
              <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Playlist Name
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="My awesome playlist"
                placeholderTextColor="#71717a"
                maxLength={40}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white font-medium text-sm mb-4"
              />

              <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Description (Optional)
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Add an optional description"
                placeholderTextColor="#71717a"
                maxLength={100}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white font-medium text-sm mb-6"
              />

              <TouchableOpacity
                onPress={handleCreate}
                disabled={isLoading}
                activeOpacity={0.8}
                className="w-full bg-emerald-600 hover:bg-emerald-500 rounded-xl py-3.5 items-center justify-center flex-row shadow-lg shadow-emerald-950/40"
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Plus size={18} color="#ffffff" className="mr-2" />
                    <Text className="text-white font-bold text-sm">Create Playlist</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <Text className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
                YouTube Playlist Link
              </Text>
              <TextInput
                value={importUrl}
                onChangeText={setImportUrl}
                placeholder="https://www.youtube.com/playlist?list=..."
                placeholderTextColor="#71717a"
                autoCapitalize="none"
                autoCorrect={false}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white font-medium text-xs mb-3"
              />
              <Text className="text-zinc-500 text-[11px] mb-6">
                Paste any public YouTube playlist URL to import all songs directly into your library.
              </Text>

              <TouchableOpacity
                onPress={handleImport}
                disabled={isLoading}
                activeOpacity={0.8}
                className="w-full bg-emerald-600 hover:bg-emerald-500 rounded-xl py-3.5 items-center justify-center flex-row shadow-lg shadow-emerald-950/40"
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Link size={18} color="#ffffff" className="mr-2" />
                    <Text className="text-white font-bold text-sm">Import Playlist</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

