import { useEffect } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import MuiDrawer from '@mui/material/Drawer';
import {
    Typography,
    List,
    Divider,
    IconButton,
    ListItemText,
    ListItemButton,
    Tooltip,
    Box
} from '@mui/material';
import ListItemIcon from '@mui/material/ListItemIcon';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TocIcon from '@mui/icons-material/Toc';
import SlideshowIcon from '@mui/icons-material/Slideshow';
import GroupIcon from '@mui/icons-material/Group'
import InsertChartIcon from '@mui/icons-material/InsertChart'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import DesktopMacIcon from '@mui/icons-material/DesktopMac'
import { useAPI } from '../../contexts/apiContext'
import { styled, useTheme } from '@mui/material/styles';

const drawerWidth = 280

const openedMixin = (theme) => ({
    width: drawerWidth,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
});

const closedMixin = (theme) => ({
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up('sm')]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
    },
});

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
}));


const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        ...(open && {
            ...openedMixin(theme),
            '& .MuiDrawer-paper': openedMixin(theme),
        }),
        ...(!open && {
            ...closedMixin(theme),
            '& .MuiDrawer-paper': closedMixin(theme),
        }),
    }),
);

export default function MarketplaceSidebar({ isOpenSidebar, onCloseSidebar }) {

    const theme = useTheme();

    const { pathname } = useLocation();

    const {
        isAdmin
    } = useAPI()

    const routers = [
        {
            title: 'Edições',
            path: '/',
            icon: <TocIcon />
        },
        {
            title: 'Executar Edição',
            path: '/executar',
            icon: <SlideshowIcon />
        }
    ]

    useEffect(() => {
        if (isOpenSidebar) {
            onCloseSidebar();
        }
    }, [pathname]);// eslint-disable-line react-hooks/exhaustive-deps


    return (
        <Drawer variant="permanent" open={isOpenSidebar}>
            <DrawerHeader>
                <Typography
                    sx={{
                        flexGrow: 1,
                        textAlign: 'center'
                    }}
                    variant="h6"
                >
                    Menu
                </Typography>
                <IconButton onClick={onCloseSidebar}>
                    {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                </IconButton>
            </DrawerHeader>
            <Divider />
            <List>
                {
                    routers.map(i => {
                        return (
                            <Tooltip 
                                title={i.title}
                                key={i.path}
                            >
                                <ListItemButton
                                    sx={{
                                        minHeight: 48,
                                        justifyContent: isOpenSidebar ? 'initial' : 'center',
                                        px: 2.5,
                                    }}
                                    component={RouterLink}
                                    to={i.path}
                                    selected={i.path === pathname}
                                >
                                    <ListItemIcon
                                        sx={{
                                            minWidth: 0,
                                            mr: isOpenSidebar ? 3 : 'auto',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {i.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={i.title} sx={{ opacity: isOpenSidebar ? 1 : 0 }} />
                                </ListItemButton>
                            </Tooltip>
                        )
                    })
                }
            </List>
            <Divider />
            {/* <List>
                {
                    isAdmin() && getAdminItems()
                }
            </List> */}
        </Drawer>
    );
}