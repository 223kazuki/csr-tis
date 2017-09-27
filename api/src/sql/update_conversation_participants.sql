UPDATE conversations SET participants = $2::text[] WHERE id = $1;
