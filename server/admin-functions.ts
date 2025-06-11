import { pool } from "./db";

/**
 * Admin function to delete a review
 * @param reviewId - The ID of the review to delete
 * @returns Object containing success status and points deducted
 */
export async function deleteReview(reviewId: number): Promise<{ success: boolean, pointsDeducted: number }> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // First, get the review details to identify the user
    const reviewResult = await client.query(
      'SELECT user_id, show_name FROM tv_show_reviews WHERE id = $1',
      [reviewId]
    );
    
    if (reviewResult.rows.length === 0) {
      console.log(`Review with ID ${reviewId} not found`);
      await client.query('ROLLBACK');
      return { success: false, pointsDeducted: 0 };
    }
    
    const userId = reviewResult.rows[0].user_id;
    const showName = reviewResult.rows[0].show_name || 'Unknown show';
    
    console.log(`Admin deleting review ID ${reviewId} by user ${userId} for show "${showName}"`);
    
    // Standard points for a review
    const pointsToDeduct = 5;
    
    // Delete the review
    const deleteResult = await client.query('DELETE FROM tv_show_reviews WHERE id = $1', [reviewId]);
    
    if (deleteResult.rowCount === 0) {
      console.log(`Failed to delete review with ID ${reviewId}`);
      await client.query('ROLLBACK');
      return { success: false, pointsDeducted: 0 };
    }
    
    // If we have a valid userId, handle the points deduction
    if (userId) {
      // Create negative points entry to balance out the original reward
      await client.query(
        `INSERT INTO user_points_history 
         (user_id, points, activity_type, description, created_at) 
         VALUES ($1, $2, $3, $4, NOW())`,
        [userId, -pointsToDeduct, 'review_deleted_by_admin', `Points deducted for review of ${showName} removed by admin`]
      );
      
      // Update user's total points, making sure it doesn't go below zero
      await client.query(
        `UPDATE users 
         SET total_points = GREATEST(0, COALESCE(total_points, 0) - $1) 
         WHERE id = $2`,
        [pointsToDeduct, userId]
      );
      
      console.log(`Deducted ${pointsToDeduct} points from user ${userId}`);
    }
    
    await client.query('COMMIT');
    return { success: true, pointsDeducted: pointsToDeduct };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in admin deleteReview:', error);
    throw error;
  } finally {
    client.release();
  }
}