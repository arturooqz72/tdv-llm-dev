import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Cake, Upload, Video, X, Gift, Calendar, Heart, MessageCircle, Send } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import VideoPlayer from '@/components/video/VideoPlayer';

export default function Birthdays() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    member_name: '',
    birth_date: '',
    photo_url: '',
    congratulation_message: '',
    video_url: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editMessage, setEditMessage] = useState('');
  const [newMessages, setNewMessages] = useState({});
  const [showMessages, setShowMessages] = useState({});

  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.log('Usuario no autenticado');
      }
    };
    loadUser();
  }, []);

  const { data: birthdays = [], isLoading } = useQuery({
    queryKey: ['birthdays'],
    queryFn: () => base44.entities.Birthday.list('-birth_date', 100)
  });

  const { data: allLikes = [] } = useQuery({
    queryKey: ['birthdayLikes'],
    queryFn: () => base44.entities.BirthdayLike.list()
  });

  const { data: allMessages = [] } = useQuery({
    queryKey: ['birthdayMessages'],
    queryFn: () => base44.entities.BirthdayMessage.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Birthday.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['birthdays'] });
    }
  });

  const updateMessageMutation = useMutation({
    mutationFn: ({ id, message }) => base44.entities.Birthday.update(id, { congratulation_message: message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['birthdays'] });
      setEditingId(null);
      setEditMessage('');
    }
  });

  const likeMutation = useMutation({
    mutationFn: async ({ birthdayId, isLiked }) => {
      if (isLiked) {
        const like = allLikes.find(l => l.birthday_id === birthdayId && l.user_email === currentUser.email);
        if (like) await base44.entities.BirthdayLike.delete(like.id);
      } else {
        await base44.entities.BirthdayLike.create({
          birthday_id: birthdayId,
          user_email: currentUser.email
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['birthdayLikes'] });
    }
  });

  const addMessageMutation = useMutation({
    mutationFn: ({ birthdayId, message }) => 
      base44.entities.BirthdayMessage.create({
        birthday_id: birthdayId,
        user_email: currentUser.email,
        user_name: currentUser.full_name || currentUser.email.split('@')[0],
        message
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['birthdayMessages'] });
      setNewMessages({ ...newMessages, [variables.birthdayId]: '' });
    }
  });

  const getLikesCount = (birthdayId) => {
    return allLikes.filter(l => l.birthday_id === birthdayId).length;
  };

  const isLikedByUser = (birthdayId) => {
    return currentUser && allLikes.some(l => l.birthday_id === birthdayId && l.user_email === currentUser.email);
  };

  const getBirthdayMessages = (birthdayId) => {
    return allMessages.filter(m => m.birthday_id === birthdayId).sort((a, b) => 
      new Date(b.created_date) - new Date(a.created_date)
    );
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Limit to 10MB for photos
      if (file.size > 10 * 1024 * 1024) {
        alert('La foto es muy grande. Por favor selecciona una imagen menor a 10MB.');
        e.target.value = '';
        setPhotoFile(null);
        return;
      }
      setPhotoFile(file);
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Limit to 50MB for videos
      if (file.size > 50 * 1024 * 1024) {
        alert('El video es muy grande. Por favor selecciona un video menor a 50MB.');
        e.target.value = '';
        setVideoFile(null);
        return;
      }
      setVideoFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.member_name || !formData.birth_date) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    // Validate file sizes again before submitting
    if (photoFile && photoFile.size > 10 * 1024 * 1024) {
      alert('La foto supera el tamaño máximo de 10MB. Por favor selecciona una imagen más pequeña.');
      return;
    }
    
    if (videoFile && videoFile.size > 50 * 1024 * 1024) {
      alert('El video supera el tamaño máximo de 50MB. Por favor selecciona un video más pequeño.');
      return;
    }

    setUploading(true);
    try {
      let photoUrl = '';
      let videoUrl = '';

      if (photoFile) {
        console.log('Subiendo foto...');
        const photoUpload = await base44.integrations.Core.UploadFile({ file: photoFile });
        photoUrl = photoUpload.file_url;
        console.log('Foto subida:', photoUrl);
      }

      if (videoFile) {
        console.log('Subiendo video...');
        const videoUpload = await base44.integrations.Core.UploadFile({ file: videoFile });
        videoUrl = videoUpload.file_url;
        console.log('Video subido:', videoUrl);
      }

      const birthdayData = {
        member_name: formData.member_name,
        birth_date: formData.birth_date,
        added_by: currentUser?.email || ''
      };
      
      if (photoUrl) birthdayData.photo_url = photoUrl;
      if (videoUrl) birthdayData.video_url = videoUrl;
      if (formData.congratulation_message) birthdayData.congratulation_message = formData.congratulation_message;
      
      console.log('Guardando cumpleaños:', birthdayData);
      const birthday = await base44.entities.Birthday.create(birthdayData);
      console.log('Cumpleaños guardado exitosamente');

      // Notificar a todos los usuarios que tienen activadas las notificaciones de cumpleaños
      const allPrefs = await base44.entities.NotificationPreference.filter({ upcoming_birthdays: true });
      
      for (const pref of allPrefs) {
        await base44.entities.Notification.create({
          user_email: pref.user_email,
          type: 'new_birthday',
          message: `¡Nuevo cumpleaños registrado! ${birthdayData.member_name} cumple años el ${format(parseISO(birthdayData.birth_date), 'd MMMM', { locale: es })}`,
          related_id: birthday.id,
          from_user: currentUser?.email || 'sistema'
        });
      }

      setFormData({
        member_name: '',
        birth_date: '',
        photo_url: '',
        congratulation_message: '',
        video_url: ''
      });
      setPhotoFile(null);
      setVideoFile(null);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['birthdays'] });
      alert('¡Cumpleaños guardado exitosamente!');
    } catch (error) {
      console.error('Error completo:', error);
      alert('Error al guardar el cumpleaños: ' + (error.message || 'Intenta de nuevo'));
    } finally {
      setUploading(false);
    }
  };

  const getBirthdayStatus = (birthDate) => {
    const date = parseISO(birthDate);
    const today = new Date();
    const thisYearBirthday = new Date(today.getFullYear(), date.getMonth(), date.getDate());
    
    if (isToday(thisYearBirthday)) return { text: '¡Hoy!', color: 'bg-green-500' };
    if (isTomorrow(thisYearBirthday)) return { text: 'Mañana', color: 'bg-blue-500' };
    return { text: format(thisYearBirthday, 'd MMM', { locale: es }), color: 'bg-gray-500' };
  };

  const upcomingBirthdays = birthdays
    .map(b => {
      const date = parseISO(b.birth_date);
      const today = new Date();
      const thisYearBirthday = new Date(today.getFullYear(), date.getMonth(), date.getDate());
      const nextYearBirthday = new Date(today.getFullYear() + 1, date.getMonth(), date.getDate());
      const upcoming = thisYearBirthday >= today ? thisYearBirthday : nextYearBirthday;
      return { ...b, upcomingDate: upcoming };
    })
    .sort((a, b) => a.upcomingDate - b.upcomingDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <Cake className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Cumpleaños
          </h1>
          <p className="text-gray-600 text-lg">
            Celebra con la comunidad los cumpleaños de nuestros miembros
          </p>
        </div>

        {/* Add Button */}
        <div className="mb-8 flex justify-center">
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            <Gift className="w-5 h-5 mr-2" />
            {showForm ? 'Cancelar' : 'Agregar Cumpleaños'}
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-12 border-2 border-purple-200 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50">
              <h3 className="text-xl font-semibold text-gray-900">Nuevo Cumpleaños</h3>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="member_name">Nombre del Miembro *</Label>
                    <Input
                      id="member_name"
                      value={formData.member_name}
                      onChange={(e) => setFormData({ ...formData, member_name: e.target.value })}
                      placeholder="Nombre completo"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="birth_date">Fecha de Nacimiento *</Label>
                    <Input
                      id="birth_date"
                      type="date"
                      value={formData.birth_date}
                      onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="photo">Foto del Miembro</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-purple-300 rounded-xl cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
                  >
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-600">
                        {photoFile ? photoFile.name : 'Click para subir foto (máx 10MB)'}
                      </span>
                      {photoFile && (
                        <p className="text-xs text-purple-500 mt-1">
                          {(photoFile.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      )}
                    </div>
                  </label>
                </div>

                <div>
                  <Label htmlFor="message">Mensaje de Felicitación</Label>
                  <Textarea
                    id="message"
                    value={formData.congratulation_message}
                    onChange={(e) => setFormData({ ...formData, congratulation_message: e.target.value })}
                    placeholder="Escribe un mensaje especial..."
                    className="min-h-24"
                  />
                </div>

                <div>
                  <Label htmlFor="video">Video de Felicitación</Label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    id="video-upload"
                  />
                  <label
                    htmlFor="video-upload"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-purple-300 rounded-xl cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
                  >
                    <div className="text-center">
                      <Video className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-600">
                        {videoFile ? videoFile.name : 'Click para subir video (máx 50MB)'}
                      </span>
                      {videoFile && (
                        <p className="text-xs text-purple-500 mt-1">
                          {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      )}
                    </div>
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  {uploading ? 'Guardando...' : 'Guardar Cumpleaños'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Birthdays List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingBirthdays.map((birthday) => {
            const status = getBirthdayStatus(birthday.birth_date);
            const age = new Date().getFullYear() - parseISO(birthday.birth_date).getFullYear();
            
            return (
              <Card key={birthday.id} className="overflow-hidden hover:shadow-2xl transition-shadow border-2 border-purple-100">
                <div className="relative">
                  {birthday.photo_url ? (
                    <img
                      src={birthday.photo_url}
                      alt={birthday.member_name}
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
                      <Cake className="w-20 h-20 text-purple-400" />
                    </div>
                  )}
                  <div className={`absolute top-4 right-4 ${status.color} text-white px-4 py-2 rounded-full font-semibold text-sm shadow-lg`}>
                    {status.text}
                  </div>
                  {currentUser && (
                    <button
                      onClick={() => deleteMutation.mutate(birthday.id)}
                      className="absolute top-4 left-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {birthday.member_name}
                  </h3>
                  <div className="flex items-center gap-2 text-purple-600 mb-4">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">
                      {format(parseISO(birthday.birth_date), 'd MMMM', { locale: es })} • {age} años
                    </span>
                  </div>
                  {editingId === birthday.id ? (
                    <div className="mb-4">
                      <Textarea
                        value={editMessage}
                        onChange={(e) => setEditMessage(e.target.value)}
                        placeholder="Escribe un mensaje especial..."
                        className="mb-2"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateMessageMutation.mutate({ id: birthday.id, message: editMessage })}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingId(null);
                            setEditMessage('');
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {birthday.congratulation_message && (
                        <p className="text-gray-600 mb-4 italic">
                          "{birthday.congratulation_message}"
                        </p>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(birthday.id);
                          setEditMessage(birthday.congratulation_message || '');
                        }}
                        className="mb-4"
                      >
                        {birthday.congratulation_message ? 'Editar mensaje' : 'Agregar mensaje'}
                      </Button>
                    </>
                  )}
                  {birthday.video_url && (
                    <div className="mt-4 rounded-xl overflow-hidden">
                      <VideoPlayer
                        src={birthday.video_url}
                        className="w-full aspect-video"
                      />
                    </div>
                  )}

                  {/* Likes y Mensajes */}
                  <div className="mt-6 pt-6 border-t border-purple-100">
                    <div className="flex items-center gap-4 mb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => currentUser && likeMutation.mutate({ 
                          birthdayId: birthday.id, 
                          isLiked: isLikedByUser(birthday.id) 
                        })}
                        disabled={!currentUser}
                        className={isLikedByUser(birthday.id) ? 'text-red-500' : 'text-gray-500'}
                      >
                        <Heart className={`w-5 h-5 mr-1 ${isLikedByUser(birthday.id) ? 'fill-red-500' : ''}`} />
                        {getLikesCount(birthday.id)}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowMessages({ ...showMessages, [birthday.id]: !showMessages[birthday.id] })}
                      >
                        <MessageCircle className="w-5 h-5 mr-1" />
                        {getBirthdayMessages(birthday.id).length}
                      </Button>
                    </div>

                    {showMessages[birthday.id] && (
                      <div className="space-y-3">
                        {currentUser && (
                          <div className="flex gap-2">
                            <Input
                              placeholder="Escribe tu felicitación..."
                              value={newMessages[birthday.id] || ''}
                              onChange={(e) => setNewMessages({ ...newMessages, [birthday.id]: e.target.value })}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && newMessages[birthday.id]?.trim()) {
                                  addMessageMutation.mutate({ 
                                    birthdayId: birthday.id, 
                                    message: newMessages[birthday.id] 
                                  });
                                }
                              }}
                            />
                            <Button
                              size="icon"
                              onClick={() => {
                                if (newMessages[birthday.id]?.trim()) {
                                  addMessageMutation.mutate({ 
                                    birthdayId: birthday.id, 
                                    message: newMessages[birthday.id] 
                                  });
                                }
                              }}
                              disabled={!newMessages[birthday.id]?.trim()}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        )}

                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {getBirthdayMessages(birthday.id).map((msg) => (
                            <div key={msg.id} className="bg-purple-50 rounded-lg p-3">
                              <p className="font-semibold text-sm text-purple-900">{msg.user_name}</p>
                              <p className="text-gray-700 text-sm">{msg.message}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {format(new Date(msg.created_date), 'd MMM HH:mm', { locale: es })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {!isLoading && birthdays.length === 0 && (
          <div className="text-center py-20">
            <Cake className="w-20 h-20 mx-auto text-purple-300 mb-4" />
            <p className="text-gray-500 text-lg">
              No hay cumpleaños registrados aún
            </p>
          </div>
        )}
      </div>
    </div>
  );
}