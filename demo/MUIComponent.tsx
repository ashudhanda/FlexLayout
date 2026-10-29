import * as React from "react";
import { alpha, styled } from "@mui/material/styles";
import Slider, { SliderProps } from "@mui/material/Slider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

// Demo of MUI dynamic styling: a Slider whose track/thumb switch to the theme's success
// color when the "Change Style" switch is on. The custom `success` prop is filtered out
// of the DOM via shouldForwardProp (it is styling-only), and the render counter below
// shows how often the tab re-renders.
interface MUIComponent extends SliderProps {
    success?: boolean;
}

const StyledSlider = styled(Slider, {
    shouldForwardProp: (prop) => prop !== "success",
})<MUIComponent>(({ theme }) => ({
    width: 300,
    variants: [
        {
            props: ({ success }) => success,
            style: {
                color: theme.palette.success.main,
                "& .MuiSlider-thumb": {
                    [`&:hover, &.Mui-focusVisible`]: {
                        boxShadow: `0px 0px 0px 8px ${alpha(theme.palette.success.main, 0.16)}`,
                    },
                    [`&.Mui-active`]: {
                        boxShadow: `0px 0px 0px 14px ${alpha(theme.palette.success.main, 0.16)}`,
                    },
                },
            },
        },
    ],
}));

export default function DynamicCSS() {
    const [success, setSuccess] = React.useState(false);
    const renderCountRef = React.useRef<number>(0);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSuccess(event.target.checked);
    };

    // eslint-disable-next-line react-hooks/refs -- deliberate render counter for the demo
    renderCountRef.current++;

    return (
        <div style={{ margin: 10, height: "100%", display: "flex", flexDirection: "column" }}>
            <FormControlLabel control={<Switch checked={success} onChange={handleChange} color="primary" value="dynamic-class-name" />} label="Change Style" />
            <StyledSlider success={success} defaultValue={30} sx={{ mt: 1 }} />
            {/* eslint-disable-next-line react-hooks/refs -- deliberate render counter for the demo */}
            {"Render Count: " + renderCountRef.current}
        </div>
    );
}
