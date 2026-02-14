import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function stripMarkdown(text: string): string {
    if (!text) return '';

    // Remove headers (# Header)
    text = text.replace(/^#+\s+/gm, '');

    // Remove bold/italic (**bold**, *italic*, __bold__, _italic_)
    text = text.replace(/(\*\*|__)(.*?)\1/g, '$2');
    text = text.replace(/(\*|_)(.*?)\1/g, '$2');

    // Remove links ([text](url)) - keep text
    text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

    // Remove code blocks (```code```)
    text = text.replace(/```[\s\S]*?```/g, '');

    // Remove inline code (`code`)
    text = text.replace(/`([^`]+)`/g, '$1');

    // Remove blockquotes (> quote)
    text = text.replace(/^>\s+/gm, '');

    // Remove horizontal rules (---, ***, ___)
    text = text.replace(/^(-{3,}|\*{3,}|_{3,})$/gm, '');

    // Clean up extra newlines (max 2)
    text = text.replace(/\n{3,}/g, '\n\n');

    return text.trim();
}
