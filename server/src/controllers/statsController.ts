import { Request, Response } from 'express';
import { TABLES, getClient } from '../utils/supabase';
import { logger } from '../utils/logger';

export const getAdminStats = async (req: Request, res: Response) => {
    try {
        const client = getClient();
        let userCount = 0;
        let pendingCommentCount = 0;

        // İstifadəçi sayını al
        const { count: users, error: userError } = await client
            .from(TABLES.USERS)
            .select('id', { count: 'exact', head: true });

        if (userError) {
            logger.error('Admin statistikaları - İstifadəçi sayı alınarkən xəta:', userError);
            // Xəta olsa belə davam et, say 0 olacaq
        } else {
            userCount = users ?? 0;
        }

        // Gözləyən şərh sayını al
        const { count: pendingComments, error: commentError } = await client
            .from(TABLES.COMMENTS)
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending');
        
        if (commentError) {
            logger.error('Admin statistikaları - Gözləyən şərh sayı alınarkən xəta:', commentError);
            // Xəta olsa belə davam et, say 0 olacaq
        } else {
            pendingCommentCount = pendingComments ?? 0;
        }

        // Gələcəkdə başqa statistikalar da əlavə edilə bilər

        res.json({
            userCount,
            pendingCommentCount,
            // Başqa statistika sahələri...
        });

    } catch (error: any) {
        logger.error('Admin statistikaları alınarkən ümumi xəta:', error);
        res.status(500).json({ error: 'Statistikalar alınarkən server xətası baş verdi' });
    }
}; 