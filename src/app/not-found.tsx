import { redirect } from 'next/navigation';
import { exitUrl } from '@/app/_utils/siteUrls';

// Unknown paths behave like the entry route: back to swupedia.com (the dev launcher in development).
export default function NotFound() {
    redirect(exitUrl());
}
