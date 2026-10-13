import React, { useEffect, useRef, useState } from 'react';
import {
    Box,
    Button,
    Divider,
    Typography,
} from '@mui/material';
import {
    IChatProps,
    IChatEntry,
    IChatObject,
    IChatMessageContent,
    IPlayerChatMessageArray,
    ChatObjectType
} from './ChatTypes';
import { useGame } from '@/app/_contexts/Game.context';
import ChatCard from './ChatCard';
import RichText from '../RichText/RichText';

// The game log: the server's line-by-line record of the game (gameMessages). Player-to-player
// chat is not offered on this site, so there is no message input.
const Chat: React.FC<IChatProps> = ({
    chatHistory,
    pauseAutoScroll = false,
}) => {
    const { connectedPlayer, isSpectator, getOpponent } = useGame();
    const chatBoxRef = useRef<HTMLDivElement | null>(null);
    const lastScrollTopRef = useRef(0);
    const [isScrollPaused, setIsScrollPaused] = useState(false);
    const [unreadStartIndex, setUnreadStartIndex] = useState<number | null>(null);

    const getPlayerColor = (playerId: string, connectedPlayer: string): string => {
        return playerId === connectedPlayer ? 'var(--initiative-blue)' : 'var(--initiative-red)';
    };

    const getSpectatorDisplayName = (
        playerId: string,
        connectedPlayer: string,
        getOpponent: (player: string) => string
    ): string => {
        if (playerId === connectedPlayer) return 'Player 1';
        if (playerId === getOpponent(connectedPlayer)) return 'Player 2';
        return 'Unknown Player';
    };

    const formatMessageItem = (item: IChatObject | string | number, itemIndex: number) => {
        if (item == null) {
            return '[null]';
        }
        if (typeof item === 'object') {
            if (item.type === ChatObjectType.Card) {
                const displayName = item.name;
                const isPlayerCard = item.controllerId === connectedPlayer;
                
                return (
                    <ChatCard 
                        key={`card-${itemIndex}`}
                        chatObject={item} 
                        isPlayerCard={isPlayerCard}
                    >
                        <span style={{ 
                            color: getPlayerColor(item.controllerId!, connectedPlayer),
                            textDecoration: 'underline',
                            textDecorationStyle: 'dotted'
                        }}>
                            {displayName}
                        </span>
                    </ChatCard>
                );
            }
            
            if (item.type === ChatObjectType.Player) {
                // Only players should use spectator display names
                const displayName = isSpectator && item.id 
                    ? getSpectatorDisplayName(item.id, connectedPlayer, getOpponent)
                    : item.name;
                    
                return (
                    <span key={`player-${itemIndex}`} style={{ 
                        color: getPlayerColor(item.id, connectedPlayer)
                    }}>
                        {displayName}
                    </span>
                );
            }
            
            // Fallback for unknown object types
            const displayName = isSpectator && item.id 
                ? getSpectatorDisplayName(item.id, connectedPlayer, getOpponent)
                : item.name;
            return (
                <span key={`unknown-${itemIndex}`} style={{ color: '#fff' }}>
                    {displayName}
                </span>
            );
        }
        if (typeof item === 'string' || typeof item === 'number') {
            return (
                <RichText key={`text-${itemIndex}`} text={item.toString()} />
            );
        }
        return '[invalid]';
    };

    const formatSystemMessage = (
        messageContent: (IChatObject | string | number)[], 
        index: number, 
        isAlert: boolean = false, 
        alertType?: string
    ) => {
        const getAlertStyle = (type: string) => {
            const alertColors = {
                notification: '#d500f9',
                warning: 'yellow',
                danger: 'red',
                readyStatus: 'green'
            };

            const color = alertColors[type as keyof typeof alertColors];
            return color ? { ...styles.alertBase, color } : styles.messageText;
        };

        const messageComponents = messageContent.map((item, itemIndex) => 
            formatMessageItem(item, itemIndex)
        );
        
        const textStyle = isAlert && alertType ? getAlertStyle(alertType) : styles.messageText;
        
        return (
            <Box key={index} sx={styles.chatEntryBox}>
                <Typography sx={textStyle} component="div">
                    {messageComponents}
                </Typography>
            </Box>
        );
    };

    const formatPlayerChatMessage = (message: IPlayerChatMessageArray, index: number) => {
        const [playerMessage, ...messageContent] = message;
        const displayName = isSpectator 
            ? getSpectatorDisplayName(playerMessage.id, connectedPlayer, getOpponent)
            : playerMessage.name;
        const playerColor = getPlayerColor(playerMessage.id, connectedPlayer);

        return (
            <Box key={index} sx={{ ...styles.chatEntryBox, backgroundColor: `color-mix(in srgb, ${playerColor} 13%, transparent)` }}>
                <Typography sx={styles.messageText}>
                    <span style={{ 
                        color: playerColor,
                        fontWeight: 'bold'
                    }}>
                        {displayName}
                    </span>
                    : {messageContent.join('')}
                </Typography>
            </Box>
        );
    };


    const formatMessage = (message: IChatMessageContent | undefined, index: number) => {
        if (!message) {
            // Custom gray message for pending missing (shouldn't really happen in practice as retransmit is fast)
            return (
                <Box key={index} sx={styles.chatEntryBox}>
                    <Typography sx={{ ...styles.messageText, color: '#888', fontStyle: 'italic' }}>
                        Fetching missing message...
                    </Typography>
                </Box>
            );
        }
        if ('alert' in message) {
            return formatSystemMessage(message.alert.message, index, true, message.alert.type);
        }
        
        if (Array.isArray(message)) {
            if (message.length > 0 && 
                typeof message[0] === 'object' && 'type' in message[0] && message[0].type === 'playerChat') {
                return formatPlayerChatMessage(message as IPlayerChatMessageArray, index);
            }
            return formatSystemMessage(message as (IChatObject | string | number)[], index);
        }

        return null;
    };

    const scrollToLatest = (behavior: ScrollBehavior = 'smooth') => {
        const chatBox = chatBoxRef.current;
        if (!chatBox) return;

        lastScrollTopRef.current = chatBox.scrollTop;
        chatBox.scrollTo({ top: chatBox.scrollHeight, behavior });
    };

    const handleChatScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const chatBox = event.currentTarget;
        const isScrollingUp = chatBox.scrollTop < lastScrollTopRef.current;
        const isAwayFromBottom = chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight > 24;

        lastScrollTopRef.current = chatBox.scrollTop;

        if (isScrollPaused && !isAwayFromBottom) {
            setIsScrollPaused(false);
            setUnreadStartIndex(null);
            return;
        }

        if (pauseAutoScroll && !isScrollPaused && isScrollingUp && isAwayFromBottom) {
            setIsScrollPaused(true);
            setUnreadStartIndex(chatHistory.length);
        }
    };

    const resumeChat = () => {
        setIsScrollPaused(false);
        setUnreadStartIndex(null);
    };

    const unreadMessageCount = unreadStartIndex === null
        ? 0
        : Math.max(0, chatHistory.length - unreadStartIndex);

    useEffect(() => {
        if (!isScrollPaused) {
            scrollToLatest();
        }
    }, [chatHistory, isScrollPaused]);

    useEffect(() => {
        if (unreadStartIndex !== null && chatHistory.length < unreadStartIndex) {
            setIsScrollPaused(false);
            setUnreadStartIndex(null);
        }
    }, [chatHistory.length, unreadStartIndex]);
    // ------------------------STYLES------------------------//

    const styles = {
        chatScrollContainer: {
            position: 'relative',
            display: 'flex',
            flex: 1,
            minHeight: 0,
        },
        chatBox: {
            p: '0.5em',
            minHeight: '100px',
            overflowY: 'auto',
            backgroundColor: '#28282800',
            flex: 1,
        },
        pausedButton: {
            position: 'absolute',
            zIndex: 2,
            bottom: '0.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 1rem)',
            maxWidth: '15rem',
            minWidth: 0,
            px: '0.8rem',
            py: '0.35rem',
            borderRadius: '999px',
            color: '#fff',
            backgroundColor: 'rgba(20, 20, 20, 0.94)',
            border: '1px solid rgba(255, 254, 80, 0.55)',
            fontSize: '0.75rem',
            lineHeight: 1.2,
            textTransform: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
            '&:hover': {
                backgroundColor: 'rgba(40, 40, 40, 0.98)',
                '& .paused-label': {
                    display: 'none',
                },
                '& .unread-label': {
                    display: 'inline',
                },
            },
        },
        unreadLabel: {
            display: 'none',
        },
        newMessagesDivider: {
            my: '0.25rem',
            color: '#FFFE50',
            fontSize: '0.7rem',
            '&::before, &::after': {
                borderColor: '#FFFE50',
                opacity: 0.7,
            },
        },
        chatMessageStack: {
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
        },
        messageText: {
            fontSize: { xs: '0.95rem', md: '1em' },
            color: '#fff',
            lineHeight: { xs: '1.25rem', md: '1rem' },
            m: 0

        },
        // Base style for alert messages
        alertBase: {
            fontSize: { xs: '0.95rem', md: '1em' },
            lineHeight: { xs: '1.25rem', md: '1em' },
        },
        chatEntryBox: {
            p: '1rem .25rem',
            borderTop: '1px solid',
            borderColor: '#FFFE5031',
        },
        chatEntryDivider: {
            borderColor: '#FFFE50',
            opacity: 0.3,
        },
    };

    return (
        <>
            <Box sx={styles.chatScrollContainer}>
                {isScrollPaused && (
                    <Button
                        onClick={resumeChat}
                        sx={styles.pausedButton}
                        aria-label={`Chat paused due to scrolling. ${unreadMessageCount} new messages. Click to resume.`}
                    >
                        <span className="paused-label">Chat paused due to scrolling</span>
                        <Box component="span" className="unread-label" sx={styles.unreadLabel}>
                            {unreadMessageCount} new {unreadMessageCount === 1 ? 'message' : 'messages'}
                        </Box>
                    </Button>
                )}
                <Box ref={chatBoxRef} onScroll={handleChatScroll} sx={styles.chatBox}>
                    <Box sx={styles.chatMessageStack}>
                        {chatHistory && chatHistory.map((chatEntry: IChatEntry, index: number) => (
                            <React.Fragment key={`${chatEntry.date}-${index}`}>
                                {unreadStartIndex === index && unreadMessageCount > 0 && (
                                    <Divider sx={styles.newMessagesDivider}>New messages</Divider>
                                )}
                                {formatMessage(chatEntry?.message, index)}
                            </React.Fragment>
                        ))}
                    </Box>
                </Box>
            </Box>
        </>

    );
};

export default Chat;
