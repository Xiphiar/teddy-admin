import React, {useState,useEffect} from "react";
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'

export default function TraitSelect({value, set, label, options, required}) {
    const [selected, setSelected] = useState(value)
    const [customValue, setCustomValue] = useState('')
    //console.log(`${label}: `,value, selected, customValue)

    // useEffect(()=>{
    //     setSelected(value)
    //     set(value)
    // },[value])

    //if (selected === "other" && customValue) set(customValue)
    return (
        <Row className="mb-3">
            <Form.Group as={Row} controlId="BaseDesignSelect">
                <Col md="6">
                    <Form.Label>{label}</Form.Label>
                    <Form.Control
                        required={required}
                        as="select"
                        value={selected}
                        onChange={e => {
                            if (e.target.value === "other") {
                                set(customValue)
                            } else {
                                set(e.target.value)
                            }
                            setSelected(e.target.value);
                    }}
                    >
                        <option value={''} key={`${label}-none`}>None</option>
                        {options.map((item) => {
                            return (<option key={`${label}-${item}`}>{item}</option>)
                        })}
                        <option key={`${label}-other`} value='other'>Other</option>
                    </Form.Control>
                </Col>
                
                { selected === "other" ? 
                    <>
                        <Col md="6">
                        <Form.Label>{`Other ${label}`}</Form.Label>
                        <Form.Control
                            required
                            type="text"
                            value={customValue}
                            onChange={e => {
                                setCustomValue(e.target.value)
                                set(e.target.value)
                            }}
                        />
                        <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                        </Col>
                    </>
                :
                    null
                }

            </Form.Group>
        </Row>
    );
}
  