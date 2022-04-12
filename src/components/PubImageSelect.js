import React, { useMemo } from "react";
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'

export function PubImageSelect({value, set, options}) {
    
    useMemo(() => {
        if (!options.length) set()
        else if (value && !options.find((option) => option.url === value)) {
            set(options[0].url)
        }
    }, [options])
    
    return (
            <Form.Group as={Col} md="6" controlId="BaseDesignSelect">
                <Form.Control
                    required
                    as="select"
                    value={value}
                    disabled={!options.length}
                    onChange={e => {
                        set(e.target.value)}}
                >
                    { options.length ?
                        <option value={""}>Choose...</option>
                    :
                        <option value={""}>Select a Base Design</option>
                    }
                    { options.map((option) => {
                        return (
                            <option value={option.url}>{option.name}</option>
                        )
                    })
                    /*
                    <option value={"Teddy-bear"}>Teddy-bear</option>
                    <option value={'Ro-Bear'}>Ro-Bear</option>
                    <option value={'Zom-Bear'}>Zom-Bear</option>
                    <option value={'Error'}>Error</option>
                    <option value={'Factory'}>Factory</option>
                    */
                }
                </Form.Control>
                <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
            </Form.Group>
    );
}
  