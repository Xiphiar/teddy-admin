import React, {useState} from "react";
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'

export default function FaceSelect({value, set}) {
    const [selected, setSelected] = useState(false)
    const [customValue, setCustomValue] = useState('')

    //if (selected === "other" && customValue) set(customValue)
    return (
        <Row className="mb-3">
            <Form.Group as={Col} md="4" controlId="BaseDesignSelect">
                <Form.Label>Facial Expression</Form.Label>
                <Form.Control
                    required
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
                    <option value={false}>None</option>
                    <option>Aint no snitch</option>
                    <option>Angry</option>
                    <option>Confused</option>
                    <option>Dead serious</option>
                    <option>Evil</option>
                    <option>Happy</option>
                    <option>Shocked</option>
                    <option>Smug</option>
                    <option>Teddy Smile</option>
                    <option value='other'>Other</option>
                </Form.Control>
                { selected === "other" ? 
                    <>
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
                    </>
                :
                    null
                }

            </Form.Group>
        </Row>
    );
}
  