import { Request, Response } from 'express';
import { TABLES, getClient } from '../utils/supabase';

// Arkadaşlık isteği gönder
export const sendFriendRequest = async (req: Request, res: Response) => {
  try {
    const senderUserId = req.user?.userId;
    const { receiverId } = req.params; // URL'den alıcı kullanıcı ID'si
    
    if (!senderUserId) {
      return res.status(401).json({ error: 'Giriş etmək lazımdır' });
    }

    // receiverId bir sayı olmalı
    const receiverIdNum = parseInt(receiverId, 10);
    if (isNaN(receiverIdNum)) {
      return res.status(400).json({ error: 'Keçərsiz istifadəçi ID' });
    }

    // Kendi kendine arkadaşlık isteği gönderilememeli
    if (senderUserId === receiverIdNum) {
      return res.status(400).json({ error: 'Özünüzə dost istəyi göndərə bilməzsiniz' });
    }

    // Alıcı kullanıcının var olup olmadığını kontrol et
    const client = getClient();
    const { data: receiverUser, error: receiverError } = await client
      .from(TABLES.USERS)
      .select('id')
      .eq('id', receiverIdNum)
      .single();

    if (receiverError || !receiverUser) {
      return res.status(404).json({ error: 'Alıcı istifadəçi tapılmadı' });
    }

    // Önceden istek gönderilmiş mi kontrol et
    const { data: existingRequest, error: existingRequestError } = await client
      .from('friendships')
      .select('id, status, sender_id, receiver_id')
      .or(`sender_id.eq.${senderUserId},receiver_id.eq.${senderUserId}`)
      .or(`sender_id.eq.${receiverIdNum},receiver_id.eq.${receiverIdNum}`)
      .single();

    if (existingRequestError && existingRequestError.code !== 'PGRST116') {
      // PGRST116: Single row not found hatası değilse gerçek bir hata
      console.error('Mövcud dostluq istəyi yoxlanılarkən xəta baş verdi:', existingRequestError);
      return res.status(500).json({ error: 'Dostluq istəyi yoxlanılarkən xəta baş verdi' });
    }

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        // Gönderen ve alıcı rolleri ters mi kontrol et
        if (existingRequest.sender_id === receiverIdNum && existingRequest.receiver_id === senderUserId) {
          // Karşılıklı istek - bu durumda isteği otomatik kabul et
          const { error: acceptError } = await client
            .from('friendships')
            .update({ status: 'accepted', updated_at: new Date().toISOString() })
            .eq('id', existingRequest.id);

          if (acceptError) {
            console.error('Dostluq istəyi qəbul edilərkən xəta baş verdi:', acceptError);
            return res.status(500).json({ error: 'Dostluq istəyi qəbul edilərkən xəta baş verdi' });
          }

          return res.status(200).json({ 
            message: 'Dostluq istəyi avtomatik qəbul edildi', 
            status: 'accepted',
            requestId: existingRequest.id
          });
        } else {
          return res.status(409).json({ 
            error: 'Bu istifadəçiyə artıq dostluq istəyi göndərilmişdir', 
            status: existingRequest.status,
            requestId: existingRequest.id
          });
        }
      } else if (existingRequest.status === 'accepted') {
        return res.status(409).json({ 
          error: 'Siz artıq bu istifadəçi ilə dostsunuz', 
          status: 'accepted',
          requestId: existingRequest.id
        });
      } else if (existingRequest.status === 'rejected') {
        // Reddedilmiş istek durumunda güncelleme yap
        const { error: updateError } = await client
          .from('friendships')
          .update({ 
            status: 'pending', 
            updated_at: new Date().toISOString(),
            // Rolleri değiştir, şimdi red eden kullanıcı istek alan olacak
            sender_id: senderUserId, 
            receiver_id: receiverIdNum 
          })
          .eq('id', existingRequest.id);

        if (updateError) {
          console.error('Rədd edilmiş dostluq istəyi yenilənərkən xəta baş verdi:', updateError);
          return res.status(500).json({ error: 'Dostluq istəyi yenilənərkən xəta baş verdi' });
        }

        return res.status(200).json({ 
          message: 'Dostluq istəyi yeniləndi', 
          status: 'pending',
          requestId: existingRequest.id
        });
      }
    }

    // Yeni arkadaşlık isteği oluştur
    const { data: newRequest, error: insertError } = await client
      .from('friendships')
      .insert({
        sender_id: senderUserId,
        receiver_id: receiverIdNum,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Dostluq istəyi yaradılarkən xəta baş verdi:', insertError);
      return res.status(500).json({ error: 'Dostluq istəyi yaradılarkən xəta baş verdi' });
    }

    // Başarılı
    res.status(201).json({ 
      message: 'Dostluq istəyi göndərildi', 
      status: 'pending',
      requestId: newRequest.id
    });
    
  } catch (error) {
    console.error('Dostluq istəyi göndərilmə zamanı xəta baş verdi:', error);
    res.status(500).json({ error: 'Server xətası baş verdi' });
  }
};

// Arkadaşlık isteğini kabul et
export const acceptFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { requestId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Giriş etmək lazımdır' });
    }

    // requestId bir sayı olmalı
    const requestIdNum = parseInt(requestId, 10);
    if (isNaN(requestIdNum)) {
      return res.status(400).json({ error: 'Keçərsiz istək ID' });
    }

    const client = getClient();
    
    // İsteğin var olduğunu ve kullanıcının alıcı olduğunu kontrol et
    const { data: friendRequest, error: requestError } = await client
      .from('friendships')
      .select('*')
      .eq('id', requestIdNum)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .single();

    if (requestError || !friendRequest) {
      return res.status(404).json({ error: 'Dostluq istəyi tapılmadı və ya sizin bu istək üzərində hüququnuz yoxdur' });
    }

    // İsteği kabul et
    const { error: updateError } = await client
      .from('friendships')
      .update({ 
        status: 'accepted', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', requestIdNum);

    if (updateError) {
      console.error('Dostluq istəyi qəbul edilərkən xəta baş verdi:', updateError);
      return res.status(500).json({ error: 'Dostluq istəyi qəbul edilərkən xəta baş verdi' });
    }

    res.status(200).json({ 
      message: 'Dostluq istəyi qəbul edildi',
      friendship: {
        id: friendRequest.id,
        sender_id: friendRequest.sender_id,
        receiver_id: friendRequest.receiver_id,
        status: 'accepted'
      }
    });
    
  } catch (error) {
    console.error('Dostluq istəyi qəbul edilərkən xəta baş verdi:', error);
    res.status(500).json({ error: 'Server xətası baş verdi' });
  }
};

// Arkadaşlık isteğini reddet
export const rejectFriendRequest = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { requestId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Giriş etmək lazımdır' });
    }

    // requestId bir sayı olmalı
    const requestIdNum = parseInt(requestId, 10);
    if (isNaN(requestIdNum)) {
      return res.status(400).json({ error: 'Keçərsiz istək ID' });
    }

    const client = getClient();
    
    // İsteğin var olduğunu ve kullanıcının alıcı VEYA gönderen olduğunu kontrol et
    const { data: friendRequest, error: requestError } = await client
      .from('friendships')
      .select('*')
      .eq('id', requestIdNum)
      .or(`receiver_id.eq.${userId},sender_id.eq.${userId}`)
      .eq('status', 'pending')
      .single();

    if (requestError || !friendRequest) {
      return res.status(404).json({ error: 'Dostluq istəyi tapılmadı və ya sizin bu istək üzərində hüququnuz yoxdur' });
    }

    // İsteği reddet
    const { error: updateError } = await client
      .from('friendships')
      .update({ 
        status: 'rejected', 
        updated_at: new Date().toISOString() 
      })
      .eq('id', requestIdNum);

    if (updateError) {
      console.error('Dostluq istəyi rədd edilərkən xəta baş verdi:', updateError);
      return res.status(500).json({ error: 'Dostluq istəyi rədd edilərkən xəta baş verdi' });
    }

    res.status(200).json({ 
      message: 'Dostluq istəyi rədd edildi',
      friendship: {
        id: friendRequest.id,
        sender_id: friendRequest.sender_id,
        receiver_id: friendRequest.receiver_id,
        status: 'rejected'
      }
    });
    
  } catch (error) {
    console.error('Dostluq istəyi rədd edilərkən xəta baş verdi:', error);
    res.status(500).json({ error: 'Server xətası baş verdi' });
  }
};

// Arkadaşlıktan çıkar
export const removeFriend = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { friendId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Giriş etmək lazımdır' });
    }

    // friendId bir sayı olmalı
    const friendIdNum = parseInt(friendId, 10);
    if (isNaN(friendIdNum)) {
      return res.status(400).json({ error: 'Keçərsiz istifadəçi ID' });
    }

    const client = getClient();
    
    // Arkadaşlık kaydını bul (kullanıcı gönderen veya alıcı olabilir)
    const { data: friendship, error: friendshipError } = await client
      .from('friendships')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendIdNum}),and(sender_id.eq.${friendIdNum},receiver_id.eq.${userId})`)
      .eq('status', 'accepted')
      .single();

    if (friendshipError || !friendship) {
      return res.status(404).json({ error: 'Bu istifadəçi ilə dostluq əlaqəsi tapılmadı' });
    }

    // Arkadaşlık kaydını sil
    const { error: deleteError } = await client
      .from('friendships')
      .delete()
      .eq('id', friendship.id);

    if (deleteError) {
      console.error('Dostluq əlaqəsi silinərkən xəta baş verdi:', deleteError);
      return res.status(500).json({ error: 'Dostluq əlaqəsi silinərkən xəta baş verdi' });
    }

    res.status(200).json({ 
      message: 'Dostluq əlaqəsi silindi',
      friendship: {
        id: friendship.id,
        sender_id: friendship.sender_id,
        receiver_id: friendship.receiver_id
      }
    });
    
  } catch (error) {
    console.error('Dostluq əlaqəsi silinərkən xəta baş verdi:', error);
    res.status(500).json({ error: 'Server xətası baş verdi' });
  }
};

// Arkadaş listesini getir
export const getFriends = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Giriş etmək lazımdır' });
    }

    const client = getClient();
    
    // Arkadaşlık ilişkilerini bul (kullanıcı gönderen veya alıcı olabilir)
    const { data: friendships, error: friendshipsError } = await client
      .from('friendships')
      .select('id, sender_id, receiver_id, created_at, updated_at')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (friendshipsError) {
      console.error('Dostlar siyahısı alınarkən xəta baş verdi:', friendshipsError);
      return res.status(500).json({ error: 'Dostlar siyahısı alınarkən xəta baş verdi' });
    }

    // Arkadaş ID'lerini topla
    const friendIds = friendships.map(friendship => 
      friendship.sender_id === userId ? friendship.receiver_id : friendship.sender_id
    );

    if (friendIds.length === 0) {
      return res.json({ friends: [] });
    }

    // Arkadaş profil bilgilerini getir
    const { data: friends, error: friendsError } = await client
      .from(TABLES.USERS)
      .select('id, username, avatar_url, created_at')
      .in('id', friendIds);

    if (friendsError) {
      console.error('Dost profilləri alınarkən xəta baş verdi:', friendsError);
      return res.status(500).json({ error: 'Dost profilləri alınarkən xəta baş verdi' });
    }

    // Arkadaşlık ID'lerini de ekle
    const friendsWithRelation = friends.map(friend => {
      const friendship = friendships.find(fs => 
        fs.sender_id === friend.id || fs.receiver_id === friend.id
      );
      return {
        ...friend,
        friendship_id: friendship?.id,
        friendship_date: friendship?.created_at
      };
    });

    res.json({ friends: friendsWithRelation });
    
  } catch (error) {
    console.error('Dostlar siyahısı alınarkən xəta baş verdi:', error);
    res.status(500).json({ error: 'Server xətası baş verdi' });
  }
};

// Gelen arkadaşlık isteklerini getir
export const getIncomingFriendRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Giriş etmək lazımdır' });
    }

    const client = getClient();
    
    // Kullanıcıya gelen bekleyen arkadaşlık isteklerini bul
    const { data: requests, error: requestsError } = await client
      .from('friendships')
      .select('id, sender_id, created_at')
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    if (requestsError) {
      console.error('Gələn istəklər alınarkən xəta baş verdi:', requestsError);
      return res.status(500).json({ error: 'Gələn istəklər alınarkən xəta baş verdi' });
    }

    if (requests.length === 0) {
      return res.json({ requests: [] });
    }

    // İstek gönderen kullanıcıların ID'lerini topla
    const senderIds = requests.map(request => request.sender_id);

    // İstek gönderen kullanıcıların profil bilgilerini getir
    const { data: senders, error: sendersError } = await client
      .from(TABLES.USERS)
      .select('id, username, avatar_url')
      .in('id', senderIds);

    if (sendersError) {
      console.error('İstək göndərən profilləri alınarkən xəta baş verdi:', sendersError);
      return res.status(500).json({ error: 'İstək göndərən profilləri alınarkən xəta baş verdi' });
    }

    // İstek ve kullanıcı bilgilerini birleştir
    const requestsWithSenders = requests.map(request => {
      const sender = senders.find(user => user.id === request.sender_id);
      return {
        id: request.id,
        created_at: request.created_at,
        sender: sender || null
      };
    });

    res.json({ requests: requestsWithSenders });
    
  } catch (error) {
    console.error('Gələn istəklər alınarkən xəta baş verdi:', error);
    res.status(500).json({ error: 'Server xətası baş verdi' });
  }
};

// Gönderilen arkadaşlık isteklerini getir
export const getOutgoingFriendRequests = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Giriş etmək lazımdır' });
    }

    const client = getClient();
    
    // Kullanıcının gönderdiği bekleyen arkadaşlık isteklerini bul
    const { data: requests, error: requestsError } = await client
      .from('friendships')
      .select('id, receiver_id, created_at')
      .eq('sender_id', userId)
      .eq('status', 'pending');

    if (requestsError) {
      console.error('Göndərilən istəklər alınarkən xəta baş verdi:', requestsError);
      return res.status(500).json({ error: 'Göndərilən istəklər alınarkən xəta baş verdi' });
    }

    if (requests.length === 0) {
      return res.json({ requests: [] });
    }

    // İstek alıcılarının ID'lerini topla
    const receiverIds = requests.map(request => request.receiver_id);

    // İstek alıcılarının profil bilgilerini getir
    const { data: receivers, error: receiversError } = await client
      .from(TABLES.USERS)
      .select('id, username, avatar_url')
      .in('id', receiverIds);

    if (receiversError) {
      console.error('İstək alan profilləri alınarkən xəta baş verdi:', receiversError);
      return res.status(500).json({ error: 'İstək alan profilləri alınarkən xəta baş verdi' });
    }

    // İstek ve kullanıcı bilgilerini birleştir
    const requestsWithReceivers = requests.map(request => {
      const receiver = receivers.find(user => user.id === request.receiver_id);
      return {
        id: request.id,
        created_at: request.created_at,
        receiver: receiver || null
      };
    });

    res.json({ requests: requestsWithReceivers });
    
  } catch (error) {
    console.error('Göndərilən istəklər alınarkən xəta baş verdi:', error);
    res.status(500).json({ error: 'Server xətası baş verdi' });
  }
};

// İki kullanıcı arasındaki arkadaşlık durumunu kontrol et
export const checkFriendshipStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { otherUserId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Giriş etmək lazımdır' });
    }

    // otherUserId bir sayı olmalı
    const otherUserIdNum = parseInt(otherUserId, 10);
    if (isNaN(otherUserIdNum)) {
      return res.status(400).json({ error: 'Keçərsiz istifadəçi ID' });
    }

    // Kendi kendine kontrol edilemez
    if (userId === otherUserIdNum) {
      return res.status(400).json({ error: 'Özünüzlə dostluq statusu yoxlanıla bilməz' });
    }

    const client = getClient();
    
    // İki kullanıcı arasındaki arkadaşlık kaydını bul
    const { data: friendship, error: friendshipError } = await client
      .from('friendships')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserIdNum}),and(sender_id.eq.${otherUserIdNum},receiver_id.eq.${userId})`)
      .maybeSingle();

    if (friendshipError && friendshipError.code !== 'PGRST116') {
      console.error('Dostluq statusu yoxlanılarkən xəta baş verdi:', friendshipError);
      return res.status(500).json({ error: 'Dostluq statusu yoxlanılarkən xəta baş verdi' });
    }

    if (!friendship) {
      return res.json({ 
        status: 'none',
        message: 'Dostluq əlaqəsi yoxdur',
        actionable: true // Hiçbir ilişki yoksa arkadaş ekleyebilmeli
      });
    }

    let actionable = false;
    let message = '';

    if (friendship.status === 'pending') {
      if (friendship.sender_id === userId) {
        message = 'Dostluq istəyi göndərilmiş';
        actionable = false; // İsteği gönderen kullanıcı bir şey yapamaz
      } else {
        message = 'Qəbul edilməmiş dostluq istəyi var';
        actionable = true; // İsteği alan kullanıcı kabul veya red edebilir
      }
    } else if (friendship.status === 'accepted') {
      message = 'Dostsunuz';
      actionable = true; // Arkadaşlıktan çıkarabilir
    } else if (friendship.status === 'rejected') {
      if (friendship.sender_id === userId) {
        message = 'Dostluq istəyiniz rədd edilmişdir';
        actionable = true; // Reddedilen isteği gönderen yeniden istek gönderebilir
      } else {
        message = 'Rədd edilmiş dostluq istəyi';
        actionable = false; // Reddeden kullanıcı bir şey yapamaz
      }
    }

    res.json({ 
      status: friendship.status,
      message,
      actionable,
      friendship_id: friendship.id,
      sender_id: friendship.sender_id,
      receiver_id: friendship.receiver_id,
      updated_at: friendship.updated_at
    });
    
  } catch (error) {
    console.error('Dostluq statusu yoxlanılarkən xəta baş verdi:', error);
    res.status(500).json({ error: 'Server xətası baş verdi' });
  }
};

// Bildirim sayısını getir
export const getFriendRequestsCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Giriş etmək lazımdır' });
    }

    const client = getClient();
    
    // Kullanıcıya gelen bekleyen arkadaşlık isteklerinin sayısını al
    const { count, error: countError } = await client
      .from('friendships')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('status', 'pending');

    if (countError) {
      console.error('Dostluq istəkləri sayısı alınarkən xəta baş verdi:', countError);
      return res.status(500).json({ error: 'Dostluq istəkləri sayısı alınarkən xəta baş verdi' });
    }

    res.json({ count: count || 0 });
    
  } catch (error) {
    console.error('Dostluq istəkləri sayısı alınarkən xəta baş verdi:', error);
    res.status(500).json({ error: 'Server xətası baş verdi' });
  }
}; 